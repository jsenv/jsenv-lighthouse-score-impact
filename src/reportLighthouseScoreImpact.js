/* eslint-disable import/max-dependencies */

// https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token

import { createOperation } from "@jsenv/cancellation"
import { createLogger } from "@jsenv/logger"
import {
  wrapExternalFunction,
  createCancellationTokenForProcess,
  assertAndNormalizeDirectoryUrl,
  urlToFileSystemPath,
  readFile,
  resolveUrl,
} from "@jsenv/util"
import { exec } from "./internal/exec.js"
import { getGist, postGist, patchGist } from "./internal/gists.js"
import {
  getPullRequest,
  getPullRequestCommentMatching,
  patchPullRequestComment,
  postPullRequestComment,
} from "./internal/pull-requests.js"
import { GENERATED_BY_COMMENT, generateCommentBody } from "./internal/generateCommentBody.js"

export const reportLighthouseScoreImpact = async ({
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  projectDirectoryUrl,
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  jsonFileGenerateCommand = "node ./.github/workflows/lighthouse-score-impact/generate-lighthouse-report.js",
  jsonFileRelativeUrl = "./lighthouse/lighthouse-report.json",
  installCommand = "npm install",
  runLink,
  commandLogs = false,
  skipGistWarning = false,
}) => {
  return wrapExternalFunction(
    async () => {
      projectDirectoryUrl = assertAndNormalizeDirectoryUrl(projectDirectoryUrl)

      if (typeof githubToken !== "string") {
        throw new TypeError(`githubToken must be a string but received ${githubToken}`)
      }
      if (typeof repositoryOwner !== "string") {
        throw new TypeError(`repositoryOwner must be a string but received ${repositoryOwner}`)
      }
      if (typeof repositoryName !== "string") {
        throw new TypeError(`repositoryName must be a string but received ${repositoryName}`)
      }
      pullRequestNumber = String(pullRequestNumber)
      if (typeof pullRequestNumber !== "string") {
        throw new TypeError(`pullRequestNumber must be a string but received ${pullRequestNumber}`)
      }
      if (typeof installCommand !== "string") {
        throw new TypeError(`installCommand must be a string but received ${installCommand}`)
      }

      const logger = createLogger({ logLevel })
      logger.debug(`projectDirectoryUrl: ${projectDirectoryUrl}`)

      logger.debug(
        `get pull request ${getPullRequestUrl({
          repositoryOwner,
          repositoryName,
          pullRequestNumber,
        })}`,
      )
      const pullRequest = await getPullRequest(
        { repositoryOwner, repositoryName, pullRequestNumber },
        { cancellationToken, githubToken },
      )
      const pullRequestBase = pullRequest.base.ref
      const pullRequestHead = pullRequest.head.ref

      const isFork = pullRequest.base.repo.full_name !== pullRequest.head.repo.full_name
      const isInPullRequestWorkflow = process.env.GITHUB_EVENT_NAME === "pull_request"
      if (isFork && isInPullRequestWorkflow) {
        logger.warn(`The github token will certainly not be allowed to post comment in the pull request.
This is because pull request comes from a fork and your workflow is runned on "pull_request".
To fix this, change "pull_request" for "pull_request_target" in your workflow file.
See https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request_target`)
      }

      let headRef
      if (isFork) {
        // https://github.community/t/checkout-a-branch-from-a-fork/276/2
        headRef = `refs/pull/${pullRequestNumber}/merge`
      } else {
        headRef = pullRequestHead
      }

      logger.debug(
        `searching lighthouse comment in pull request ${getPullRequestUrl({
          repositoryOwner,
          repositoryName,
          pullRequestNumber,
        })}`,
      )
      const existingComment = await createOperation({
        cancellationToken,
        start: () =>
          getPullRequestCommentMatching(
            ({ body }) => body.includes(GENERATED_BY_COMMENT),
            {
              repositoryOwner,
              repositoryName,
              pullRequestNumber,
            },
            { cancellationToken, githubToken },
          ),
      })
      if (existingComment) {
        logger.debug(`comment found at ${commentToUrl(existingComment)}.`)
      } else {
        logger.debug(`comment not found`)
      }

      const patchOrPostComment = async (commentBody) => {
        commentBody = `${commentBody}
<br />
${renderGeneratedBy({ runLink })}`

        if (existingComment) {
          logger.info(`updating comment at ${commentToUrl(existingComment)}`)
          const comment = await patchPullRequestComment(
            existingComment.id,
            commentBody,
            {
              repositoryOwner,
              repositoryName,
              pullRequestNumber,
            },
            {
              cancellationToken,
              githubToken,
            },
          )
          logger.info("comment updated")
          return comment
        }

        logger.info(`creating comment`)
        const comment = await postPullRequestComment(
          commentBody,
          {
            repositoryOwner,
            repositoryName,
            pullRequestNumber,
          },
          {
            cancellationToken,
            githubToken,
          },
        )
        logger.info(`comment created at ${commentToUrl(comment)}`)
        return comment
      }

      const execCommandInProjectDirectory = (command) => {
        logger.info(`> ${command}`)
        return exec(command, {
          cwd: urlToFileSystemPath(projectDirectoryUrl),
          onLog: (string) => {
            if (commandLogs) {
              logger.info(string)
            }
          },
          onErrorLog: (string) => logger.error(string),
        })
      }

      const ensuteGitConfig = async (name, valueIfMissing) => {
        try {
          await execCommandInProjectDirectory(`git config ${name}`)
          return () => {}
        } catch (e) {
          await execCommandInProjectDirectory(`git config ${name} "${valueIfMissing}"`)
          return async () => {
            await execCommandInProjectDirectory(`git config --unset ${name}`)
          }
        }
      }

      const ensureGitUserEmail = () => ensuteGitConfig("user.email", "you@example.com")
      const ensureGitUserName = () => ensuteGitConfig("user.name", "Your Name")

      const fetchRef = async (ref) => {
        // cannot use depth=1 arg otherwise git merge might have merge conflicts
        await execCommandInProjectDirectory(`git fetch --no-tags --prune origin ${ref}`)
      }

      let baseReport
      try {
        await fetchRef(pullRequestBase)
        await execCommandInProjectDirectory(`git reset --hard origin/${pullRequestBase}`)
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(jsonFileGenerateCommand)
        baseReport = JSON.parse(
          await readFile(resolveUrl(jsonFileRelativeUrl, projectDirectoryUrl)),
        )
        logger.debug(`report for ${pullRequestBase} generated`)
      } catch (error) {
        logger.error(error.stack)
        const comment = await patchOrPostComment(`${GENERATED_BY_COMMENT}
<h2>Lighthouse impact</h2>

---

**Error:** Error while trying to generate a report for ${pullRequestBase}.

<pre>${error.stack}</pre>

---`)

        return { error, comment }
      }

      let afterMergeReport
      try {
        // generateLighthouseReport might generate files that could conflict when doing the merge
        // reset to avoid potential merge conflicts
        await execCommandInProjectDirectory(`git reset --hard origin/${pullRequestBase}`)
        // Avoid "The following untracked working tree files would be overwritten by merge" error
        await execCommandInProjectDirectory(`git clean  -d  -f .`)
        await fetchRef(headRef)
        // ensure there is user.email + user.name required to perform git merge command
        // without them git would complain that it does not know who we are
        const restoreGitUserEmail = await ensureGitUserEmail()
        const restoreGitUserName = await ensureGitUserName()
        await execCommandInProjectDirectory(`git merge FETCH_HEAD --allow-unrelated-histories`)
        await restoreGitUserEmail()
        await restoreGitUserName()
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(jsonFileGenerateCommand)
        afterMergeReport = JSON.parse(
          await readFile(resolveUrl(jsonFileRelativeUrl, projectDirectoryUrl)),
        )
        logger.debug("report after merge generated")
      } catch (error) {
        logger.error(error.stack)
        const comment = await patchOrPostComment(`${GENERATED_BY_COMMENT}
<h2>Lighthouse impact</h2>

---

**Error:** Error while trying to generate a report for ${pullRequestHead} merge into ${pullRequestBase}.

<pre>${error.stack}</pre>

---`)

        return { error, comment }
      }

      const patchOrPostGists = async () => {
        let baseGistId
        let afterMergeGistId

        if (existingComment) {
          const gistIds = commentToGistIds(existingComment)
          if (gistIds) {
            baseGistId = gistIds.baseGistId
            afterMergeGistId = gistIds.afterMergeGistId
            logger.debug(`gists found in comment body
--- gist for base lighthouse report ---
${gistIdToUrl(baseGistId)}
--- gist for after merge lighthouse report ---
${gistIdToUrl(afterMergeGistId)}`)
          } else {
            logger.debug(`cannot find gist id in comment body`)
          }
        }

        logger.debug(`update or create both gists.`)
        let [baseGist, afterMergeGist] = await Promise.all([
          baseGistId ? getGist(baseGistId, { cancellationToken, githubToken }) : null,
          afterMergeGistId ? getGist(afterMergeGistId, { cancellationToken, githubToken }) : null,
        ])
        const baseGistData = {
          files: {
            [`${repositoryOwner}-${repositoryName}-pr-${pullRequestNumber}-base-lighthouse-report.json`]: {
              content: JSON.stringify(baseReport, null, "  "),
            },
          },
        }
        const afterMergeGistData = {
          files: {
            [`${repositoryOwner}-${repositoryName}-pr-${pullRequestNumber}-after-merge-lighthouse-report.json`]: {
              content: JSON.stringify(afterMergeReport, null, "  "),
            },
          },
        }

        if (baseGist) {
          logger.info(`updating base gist at ${gistIdToUrl(baseGist.id)}`)
          baseGist = await patchGist(baseGist.id, baseGistData, {
            cancellationToken,
            githubToken,
          })
          logger.info(`base gist updated`)
        } else {
          logger.info(`creating base gist`)
          baseGist = await postGist(baseGistData, {
            cancellationToken,
            githubToken,
          })
          logger.info(`base gist created at ${gistIdToUrl(baseGist.id)}`)
        }
        if (afterMergeGist) {
          logger.info(`updating after merge gist at ${gistIdToUrl(afterMergeGist.id)}`)
          afterMergeGist = await patchGist(afterMergeGist.id, afterMergeGistData, {
            cancellationToken,
            githubToken,
          })
          logger.info(`after merge gist updated`)
        } else {
          logger.info(`creating after merge gist`)
          afterMergeGist = await postGist(afterMergeGistData, {
            cancellationToken,
            githubToken,
          })
          logger.info(`after merge gist created at ${gistIdToUrl(afterMergeGist.id)}`)
        }

        return {
          baseGist,
          afterMergeGist,
        }
      }

      let baseGist
      let afterMergeGist
      const headerMessages = []
      try {
        const gists = await patchOrPostGists()
        baseGist = gists.baseGist
        afterMergeGist = gists.afterMergeGist
      } catch (e) {
        if (e.responseStatus === 403) {
          if (!skipGistWarning) {
            headerMessages.push(
              `**Warning:** Link to lighthouse reports cannot be generated because github token is not allowed to create gists.`,
            )
          }
        } else {
          throw e
        }
      }
      const comment = await patchOrPostComment(
        generateCommentBody({
          headerMessages,
          baseReport,
          baseGist,
          afterMergeReport,
          afterMergeGist,
          pullRequestBase,
          pullRequestHead,
        }),
      )

      return {
        baseGist,
        afterMergeGist,
        comment,
      }
    },
    { catchCancellation: true, unhandledRejectionStrict: true },
  )
}

const baseGistIdRegex = new RegExp("<!-- base-gist-id=([a-zA-Z0-9_]+) -->")
const afterMergeGistIdRegex = new RegExp("<!-- after-merge-gist-id=([a-zA-Z0-9_]+) -->")

const commentToGistIds = (comment) => {
  const baseGistIdMatch = comment.body.match(baseGistIdRegex)
  if (!baseGistIdMatch) return null
  const afterMergeGistIdMatch = comment.body.match(afterMergeGistIdRegex)
  if (!afterMergeGistIdMatch) return null

  const baseGistId = baseGistIdMatch[1]
  const afterMergeGistId = afterMergeGistIdMatch[1]
  return { baseGistId, afterMergeGistId }
}

const commentToUrl = (comment) => {
  return comment.html_url
}

const gistIdToUrl = (gistId) => {
  return `https://gist.github.com/${gistId}`
}

const getPullRequestUrl = ({ repositoryOwner, repositoryName, pullRequestNumber }) =>
  `https://github.com/${repositoryOwner}/${repositoryName}/pull/${pullRequestNumber}`

const renderGeneratedBy = ({ runLink }) => {
  return `<sub>
  Generated by ${renderSelfLink()}${renderRunLink(runLink)}
</sub>`
}

const renderSelfLink = () => {
  return `<a href="https://github.com/jsenv/jsenv-lighthouse-score-impact">lighthouse score impact</a>`
}

const renderRunLink = (runLink) => {
  if (!runLink) return ``

  if (typeof runLink !== "object") {
    console.warn(
      `runLink ignored because it should be an object with {url, text}, received ${runLink}`,
    )
    return ""
  }

  return ` during <a href="${runLink.url}">${runLink.text}</a>`
}
