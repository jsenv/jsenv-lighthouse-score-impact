const fetch = import.meta.require("node-fetch")

export const createGist = async ({ githubApiToken, files }) => {
  let createGistResponse
  try {
    createGistResponse = await genericCreateGist({
      githubApiToken,
      files,
    })
  } catch (e) {
    throw createErrorWhileCreatingGist({
      error: e,
    })
  }
  if (createGistResponse.status !== 201) {
    // if status is 404 make sure your token got the rights
    // to create gists
    throw createUnexpectedResponseForCreateGist({
      response: createGistResponse,
      responseBodyAsJson: await createGistResponse.json(),
    })
  }
  const gist = await createGistResponse.json()
  return gist
}

// https://developer.github.com/v3/gists/#create-a-gist
const genericCreateGist = async ({ githubApiToken, files = {}, description, secret = false }) => {
  const body = JSON.stringify({ files, description, public: !secret })
  const response = await fetch(`https://api.github.com/gists`, {
    headers: {
      authorization: `token ${githubApiToken}`,
      "content-length": Buffer.byteLength(body),
    },
    method: "POST",
    body,
  })
  return response
}

const createErrorWhileCreatingGist = ({ error }) =>
  new Error(`
error while creating gist.
error: ${error.stack}`)

const createUnexpectedResponseForCreateGist = async ({ response, responseBodyAsJson }) =>
  new Error(`create gist failed: response status should be 201.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
