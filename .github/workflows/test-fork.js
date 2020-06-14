import { readGithubWorkflowEnv } from "../../src/readGithubWorkflowEnv.js"
import { getPullRequest } from "../../src/internal/pull-requests.js"

const run = async () => {
  console.log("process.env.GITHUB_REF", process.env.GITHUB_REF)

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
