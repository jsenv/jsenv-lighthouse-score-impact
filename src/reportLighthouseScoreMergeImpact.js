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

export const reportLighthouseScoreMergeImpact = async ({
  cancellationToken = createCancellationTokenForProcess(),
  logLevel,
  projectDirectoryUrl,
  githubToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  outfileRelativeUrl = "./lighthouse/lighthouse-report.json",
  generateCommand = "node ./.github/workflows/lighthouse-impact/generate-lighthouse-report.js",
  installCommand = "npm install",
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
      const execCommandInProjectDirectory = (command) => {
        logger.info(`> ${command}`)
        return exec(command, {
          cwd: urlToFileSystemPath(projectDirectoryUrl),
        })
      }

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
      // here we could detect fork and so on
      const pullRequestBase = pullRequest.base.ref
      const pullRequestHead = pullRequest.head.ref

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
            ({ body }) => body.startsWith(GENERATED_BY_COMMENT),
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

      let baseReport
      try {
        await execCommandInProjectDirectory(
          `git fetch --no-tags --prune --depth=1 origin ${pullRequestBase}`,
        )
        await execCommandInProjectDirectory(`git checkout origin/${pullRequestBase}`)
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(generateCommand)
        baseReport = JSON.parse(await readFile(resolveUrl(outfileRelativeUrl, projectDirectoryUrl)))

        // generateLighthouseReport might generate files that could conflict when doing the merge
        // reset to avoid potential merge conflicts
        await execCommandInProjectDirectory(`git reset --hard origin/${pullRequestBase}`)

        logger.debug(`report for ${pullRequestBase} generated`)
      } catch (error) {
        logger.error(error.stack)
        const comment = await patchOrPostComment(`${GENERATED_BY_COMMENT}

<h2>Lighthouse merge impact</h2>

---

**Error:** Error while trying to generate a report for ${pullRequestBase}.

<pre>${error.stack}</pre>

---`)

        return { error, comment }
      }

      let afterMergeReport
      try {
        await execCommandInProjectDirectory(`git fetch --no-tags --prune origin ${pullRequestHead}`)
        await execCommandInProjectDirectory(`git merge FETCH_HEAD`)
        await execCommandInProjectDirectory(installCommand)
        await execCommandInProjectDirectory(generateCommand)
        afterMergeReport = JSON.parse(
          await readFile(resolveUrl(outfileRelativeUrl, projectDirectoryUrl)),
        )
        logger.debug("report after merge generated")
      } catch (error) {
        logger.error(error.stack)
        const comment = await patchOrPostComment(`${GENERATED_BY_COMMENT}

<h2>Lighthouse merge impact</h2>

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
          headerMessages.push(
            `**Warning:** Link to lighthouse reports cannot be generated because github token is not allowed to create gists.`,
          )
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
