/**

https://github.com/preactjs/compressed-size-action
https://help.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions
https://help.github.com/en/actions/reference/workflow-syntax-for-github-actions

*/

import { createRequire } from "module"
import { createLogger } from "@jsenv/logger"
import { resolveUrl, readFile } from "@jsenv/util"
import { exec } from "./internal/exec.js"
import { reportLighthouseImpactIntoGithubPullRequest } from "./reportLighthouseImpactIntoGithubPullRequest.js"

const require = createRequire(import.meta.url)

const { getInput } = require("@actions/core")

const run = async () => {
  const eventName = process.env.GITHUB_EVENT_NAME
  if (!eventName) {
    throw new Error(`missing process.env.GITHUB_EVENT_NAME, we are not in a github workflow`)
  }
  if (eventName !== "pull_request") {
    throw new Error(`must be called only in a pull request`)
  }

  const githubToken = getInput("github-token") || process.env.GITHUB_TOKEN
  const logLevel = getInput("log-level")
  const command = getInput("command")
  const outFilePath = getInput("command-outfile-path")
  const projectDirectoryUrl = process.cwd()
  const logger = createLogger({ logLevel })

  if (!githubToken) {
    throw new Error(`missing githubToken`)
  }

  const githubRepository = process.env.GITHUB_REPOSITORY
  if (!githubRepository) {
    throw new Error(`missing process.env.GITHUB_REPOSITORY`)
  }

  const [repositoryOwner, repositoryName] = githubRepository.split("/")
  const pullRequestNumber = await readPullRequestNumber({ logger })

  return reportLighthouseImpactIntoGithubPullRequest(
    async () => {
      await exec(command)
      const outFileUrl = resolveUrl(outFilePath, projectDirectoryUrl)
      const outFileContent = await readFile(outFileUrl)
      return JSON.parse(outFileContent)
    },
    {
      logLevel,
      projectDirectoryUrl,
      githubToken,
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
    },
  )
}

const readPullRequestNumber = async ({ logger }) => {
  const githubRef = process.env.GITHUB_REF
  if (!githubRef) {
    throw new Error(`missing process.env.GITHUB_REF`)
  }

  const pullRequestNumber = githubRefToPullRequestNumber(githubRef)
  if (pullRequestNumber) return pullRequestNumber

  // https://github.com/actions/checkout/issues/58#issuecomment-589447479
  const githubEventFilePath = process.env.GITHUB_EVENT_PATH
  if (githubEventFilePath) {
    logger.warn(`pull request number not found in process.env.GITHUB_REF, trying inside github event file.
--- process.env.GITHUB_REF ---
${githubRef}
--- github event file path ---
${githubEventFilePath}
`)
    const githubEventFileContent = await readFile(githubEventFilePath)
    const githubEvent = JSON.parse(githubEventFileContent)
    const pullRequestNumber = githubEvent.pull_request.number
    logger.warn(`pull request number found in the file: ${pullRequestNumber}`)
    if (pullRequestNumber) {
      return pullRequestNumber
    }
  }

  throw new Error(`cannot get pull request number from process.env.GITHUB_REF
--- process.env.GITHUB_REF ---
${githubRef}`)
}

const githubRefToPullRequestNumber = (githubRef) => {
  const pullPrefix = "refs/pull/"
  const pullRequestNumberStartIndex = githubRef.indexOf(pullPrefix)
  if (pullRequestNumberStartIndex === -1) return undefined
  const afterPull = githubRef.slice(pullRequestNumberStartIndex + pullPrefix.length)
  const slashAfterPullIndex = afterPull.indexOf("/")
  if (slashAfterPullIndex === -1) return undefined
  const pullRequestNumberString = afterPull.slice(0, slashAfterPullIndex)
  return Number(pullRequestNumberString)
}

export default run()
