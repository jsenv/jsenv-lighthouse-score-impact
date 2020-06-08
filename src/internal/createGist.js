import { fetchUrl } from "@jsenv/server"

export const createGist = async ({ githubToken, files }) => {
  let createGistResponse
  try {
    createGistResponse = await genericCreateGist({
      githubToken,
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
const genericCreateGist = async ({ githubToken, files = {}, description, secret = false }) => {
  const body = JSON.stringify({ files, description, public: !secret })
  const response = await fetchUrl(`https://api.github.com/gists`, {
    headers: {
      "authorization": `token ${githubToken}`,
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
