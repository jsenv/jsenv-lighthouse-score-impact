import { readGithubWorkflowEnv } from "../../src/readGithubWorkflowEnv.js"
import { getPullRequest } from "../../src/internal/pull-requests.js"

const run = async () => {
  const {
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    githubToken,
  } = readGithubWorkflowEnv()
  const pullRequest = await getPullRequest(
    {
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
    },
    { githubToken },
  )
  console.log(pullRequest)
}

run()
