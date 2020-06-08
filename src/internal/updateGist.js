import { fetchUrl } from "@jsenv/server"

export const updateGist = async (gistId, { githubToken, files }) => {
  let updateGistResponse
  try {
    updateGistResponse = await genericUpdateGist({
      githubToken,
      gistId,
      files,
    })
  } catch (e) {
    throw createErrorWhileUpdatingGist({
      error: e,
      gistId,
    })
  }
  if (updateGistResponse.status !== 200) {
    throw createUnexpectedResponseForUpdateGist({
      response: updateGistResponse,
      responseBodyAsJson: await updateGistResponse.json(),
    })
  }
  const gist = await updateGistResponse.json()
  return gist
}

const genericUpdateGist = async ({ githubToken, gistId, files = {}, description }) => {
  const body = JSON.stringify({ files, description })
  const response = await fetchUrl(`https://api.github.com/gists/${gistId}`, {
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(body),
    },
    method: "PATCH",
    body,
  })
  return response
}

const createErrorWhileUpdatingGist = ({ error, gistId }) =>
  new Error(`error while updating gist.
error: ${error.stack}
gist id: ${gistId}`)

const createUnexpectedResponseForUpdateGist = ({ response, responseBodyAsJson }) =>
  new Error(`update gist failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
