// https://developer.github.com/v3/issues/comments/#edit-a-comment
const fetch = import.meta.require("node-fetch")

export const updatePullRequestComment = async ({
  githubApiToken,
  repositoryName,
  repositoryOwner,
  pullRequestNumber,
  commentId,
  commentBody,
}) => {
  let updatePullRequestCommentResponse
  try {
    updatePullRequestCommentResponse = await genericUpdatePullRequestComment({
      githubApiToken,
      repositoryOwner,
      repositoryName,
      commentId,
      commentBody,
    })
  } catch (e) {
    throw createErrorWhileUpdatingPullRequestComment({
      error: e,
      commentId,
      pullRequestNumber,
      repositoryName,
      repositoryOwner,
    })
  }
  if (updatePullRequestCommentResponse.status !== 200) {
    throw createUnexpectedResponseForUpdatePullRequestComment({
      response: updatePullRequestCommentResponse,
      responseBodyAsJson: await updatePullRequestCommentResponse.json(),
    })
  }
  return updatePullRequestCommentResponse
}

const genericUpdatePullRequestComment = async ({
  githubApiToken,
  repositoryOwner,
  repositoryName,
  commentId,
  commentBody,
}) => {
  const href = `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/issues/comments/${commentId}`
  const body = JSON.stringify({ body: commentBody })
  const response = await fetch(href, {
    headers: {
      authorization: `token ${githubApiToken}`,
      "content-length": Buffer.byteLength(body),
    },
    method: "PATCH",
    body,
  })
  return response
}

const createErrorWhileUpdatingPullRequestComment = ({
  error,
  commentId,
  pullRequestNumber,
  repositoryName,
  repositoryOwner,
}) =>
  new Error(`error while updating pull request comment.
error : ${error.stack}
comment id: ${commentId}
pull request number: ${pullRequestNumber}
repository name: ${repositoryName}
repository owner: ${repositoryOwner}`)

const createUnexpectedResponseForUpdatePullRequestComment = ({ response, responseBodyAsJson }) =>
  new Error(`update pull request comment failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
