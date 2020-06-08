import { readFile } from "@jsenv/util"

// https://help.github.com/en/actions/automating-your-workflow-with-github-actions/using-environment-variables
export const readGithubWorkflowEnv = () => {
  const eventName = process.env.GITHUB_EVENT_NAME
  if (!eventName) {
    throw new Error(`missing process.env.GITHUB_EVENT_NAME, we are not in a github action`)
  }
  if (eventName !== "pull_request") {
    throw new Error(`getOptionsFromGithubAction must be called only in a pull request action`)
  }

  const githubRepository = process.env.GITHUB_REPOSITORY
  if (!githubRepository) {
    throw new Error(`missing process.env.GITHUB_REPOSITORY`)
  }

  const [repositoryOwner, repositoryName] = githubRepository.split("/")

  const githubBaseRef = process.env.GITHUB_BASE_REF
  if (!githubBaseRef) {
    throw new Error(`missing process.env.GITHUB_BASE_REF`)
  }
  const pullRequestBase = githubBaseRef

  const githubHeadRef = process.env.GITHUB_HEAD_REF
  if (!githubHeadRef) {
    throw new Error(`missing process.env.GITHUB_HEAD_REF`)
  }
  const pullRequestHead = githubHeadRef

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    throw new Error(`missing process.env.GITHUB_TOKEN`)
  }

  return {
    repositoryOwner,
    repositoryName,
    pullRequestBase,
    pullRequestHead,
    githubToken,
  }
}

export const readPullRequestNumber = async ({ logger }) => {
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
