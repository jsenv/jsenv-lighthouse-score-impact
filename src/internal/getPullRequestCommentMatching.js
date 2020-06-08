import { fetchUrl } from "@jsenv/server"

export const getPullRequestCommentMatching = async (
  predicate,
  { repositoryOwner, repositoryName, pullRequestNumber, githubToken },
) => {
  let listPullRequestCommentResponse
  try {
    listPullRequestCommentResponse = await listPullRequestComment({
      githubToken,
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
  const comment = commentList.find(predicate)
  return comment
}

const listPullRequestComment = async ({
  repositoryOwner,
  repositoryName,
  pullRequestNumber,
  githubToken,
}) => {
  const response = await fetchUrl(
    `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/${pullRequestNumber}/comments`,
    {
      headers: {
        authorization: `token ${githubToken}`,
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
  new Error(`error while searching in pull request comments.
error: ${error.stack}
pull request number: ${pullRequestNumber}
repository name: ${repositoryName}
repository owner: ${repositoryOwner}`)

const createUnexpectedResponseForListPullRequestComment = ({ response, responseBodyAsJson }) =>
  new Error(`list pull request comment failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
