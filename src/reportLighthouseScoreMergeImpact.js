/* eslint-disable import/max-dependencies */

// https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token

import { createOperation } from "@jsenv/cancellation"
import { createLogger } from "@jsenv/logger"
import {
  wrapExternalFunction,
  createCancellationTokenForProcess,
  assertAndNormalizeDirectoryUrl,
  urlToFileSystemPath,
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

export const reportLighthouseScoreMergeImpact = async (
  generateLighthouseReport,
  {
    cancellationToken = createCancellationTokenForProcess(),
    logLevel,
    projectDirectoryUrl,
    githubToken,
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    installCommand = "npm install",
  },
) => {
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
        logger.debug(`> ${command}`)
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
          logger.debug(`updating comment at ${commentToUrl(existingComment)}`)
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
          logger.debug("comment updated")
          return comment
        }

        logger.debug(`creating comment`)
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
        logger.debug(`comment created at ${commentToUrl(comment)}`)
        return comment
      }

      let baseReport
      try {
        await execCommandInProjectDirectory(
          `git fetch --no-tags --prune --depth=1 origin ${pullRequestBase}`,
        )
        await execCommandInProjectDirectory(`git checkout origin/${pullRequestBase}`)
        await execCommandInProjectDirectory(installCommand)

        baseReport = await generateLighthouseReport()

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

      let headReport
      try {
        await execCommandInProjectDirectory(`git fetch --no-tags --prune origin ${pullRequestHead}`)
        await execCommandInProjectDirectory(`git merge FETCH_HEAD`)
        await execCommandInProjectDirectory(installCommand)

        headReport = await generateLighthouseReport()
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
        let headGistId

        if (existingComment) {
          const gistIds = commentToGistIds(existingComment)
          if (gistIds) {
            baseGistId = gistIds.baseGistId
            headGistId = gistIds.headGistId
            logger.debug(`gists found in comment body
--- gist for base lighthouse report ---
${gistIdToUrl(baseGistId)}
--- gist for head lighthouse report ---
${gistIdToUrl(headGistId)}`)
          } else {
            logger.debug(`cannot find gist id in comment body`)
          }
        }

        logger.debug(`update or create both gists.`)
        let [baseGist, headGist] = await Promise.all([
          baseGistId ? getGist(baseGistId, { cancellationToken, githubToken }) : null,
          headGistId ? getGist(headGistId, { cancellationToken, githubToken }) : null,
        ])
        const baseGistData = {
          files: {
            [`${repositoryOwner}-${repositoryName}-pr-${pullRequestNumber}-base-lighthouse-report.json`]: {
              content: JSON.stringify(baseReport, null, "  "),
            },
          },
        }
        const headGistData = {
          files: {
            [`${repositoryOwner}-${repositoryName}-pr-${pullRequestNumber}-merged-lighthouse-report.json`]: {
              content: JSON.stringify(headReport, null, "  "),
            },
          },
        }

        if (baseGist) {
          logger.debug(`updating base gist at ${gistIdToUrl(baseGist.id)}`)
          baseGist = await patchGist(baseGist.id, baseGistData, {
            cancellationToken,
            githubToken,
          })
          logger.debug(`base gist updated`)
        } else {
          logger.debug(`creating base gist`)
          baseGist = await postGist(baseGistData, {
            cancellationToken,
            githubToken,
          })
          logger.debug(`base gist created at ${gistIdToUrl(baseGist.id)}`)
        }
        if (headGist) {
          logger.debug(`updating head gist at ${gistIdToUrl(headGist.id)}`)
          headGist = await patchGist(headGist.id, headGistData, {
            cancellationToken,
            githubToken,
          })
          logger.debug(`head gist updated`)
        } else {
          logger.debug(`creating head gist`)
          headGist = await postGist(headGistData, {
            cancellationToken,
            githubToken,
          })
          logger.debug(`head gist created at ${gistIdToUrl(headGist.id)}`)
        }

        return {
          baseGist,
          headGist,
        }
      }

      let baseGist
      let headGist
      const headerMessages = []
      try {
        const gists = await patchOrPostGists()
        baseGist = gists.baseGist
        headGist = gists.headGist
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
          headReport,
          baseGist,
          headGist,
          pullRequestBase,
          pullRequestHead,
        }),
      )

      return {
        baseGist,
        headGist,
        comment,
      }
    },
    { catchCancellation: true, unhandledRejectionStrict: true },
  )
}

const baseGistIdRegex = new RegExp("<!-- base-gist-id=([a-zA-Z0-9_]+) -->")
const headGistIdRegex = new RegExp("<!-- head-gist-id=([a-zA-Z0-9_]+) -->")

const commentToGistIds = (comment) => {
  const baseGistIdMatch = comment.body.match(baseGistIdRegex)
  if (!baseGistIdMatch) return null
  const headGistIdMatch = comment.body.match(headGistIdRegex)
  if (!headGistIdMatch) return null

  const baseGistId = baseGistIdMatch[1]
  const headGistId = headGistIdMatch[1]
  return { baseGistId, headGistId }
}

const commentToUrl = (comment) => {
  return comment.html_url
}

const gistIdToUrl = (gistId) => {
  return `https://gist.github.com/${gistId}`
}

const getPullRequestUrl = ({ repositoryOwner, repositoryName, pullRequestNumber }) =>
  `https://github.com/${repositoryOwner}/${repositoryName}/pull/${pullRequestNumber}`
