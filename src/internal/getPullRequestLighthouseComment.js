const fetch = import.meta.require("node-fetch")

const gistIdRegex = new RegExp(
  "https:\\/\\/googlechrome\\.github\\.io\\/lighthouse\\/viewer\\/\\?gist=([a-zA-Z0-9_]+)",
)

export const getPullRequestLighthouseComment = async ({
  githubApiToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
}) => {
  let listPullRequestCommentResponse
  try {
    listPullRequestCommentResponse = await listPullRequestComment({
      githubApiToken,
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
    })
  } catch (e) {
    throw createErrorWhileSearchingGistInPullRequestComments({
      error: e,
      repositoryOwner,
      repositoryName,
      pullRequestNumber,
    })
  }
  if (listPullRequestCommentResponse.status !== 200) {
    throw createUnexpectedResponseForListPullRequestComment({
      response: listPullRequestCommentResponse,
      responseBodyAsJson: await listPullRequestCommentResponse.json(),
    })
  }

  const commentList = await listPullRequestCommentResponse.json()
  const comment = commentList.find(({ body }) => {
    const match = body.match(gistIdRegex)
    if (!match) return false
    return true
  })
  return comment
}

const listPullRequestComment = async ({
  githubApiToken,
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
}) => {
  const response = await fetch(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`,
    {
      headers: {
        authorization: `token ${githubApiToken}`,
      },
      method: "GET",
    },
  )
  return response
}

const createErrorWhileSearchingGistInPullRequestComments = ({
  error,
  pullRequestNumber,
  repositoryName,
  repositoryOwner,
}) =>
  new Error(`error while searching gist in pull request comments.
error: ${error.stack}
pull request number: ${pullRequestNumber}
repository name: ${repositoryName}
repository owner: ${repositoryOwner}`)

export const commentToGistId = (comment) => {
  const result = comment.body.match(gistIdRegex)
  return result[1]
}

const createUnexpectedResponseForListPullRequestComment = ({ response, responseBodyAsJson }) =>
  new Error(`list pull request comment failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
