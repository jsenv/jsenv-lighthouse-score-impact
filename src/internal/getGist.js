import { fetchUrl } from "@jsenv/server"

export const getGist = async (gistId, { githubToken }) => {
  let getGistResponse
  try {
    getGistResponse = await genericGetGist({
      githubToken,
      gistId,
    })
  } catch (e) {
    throw createErrorWhileGettingGist({
      error: e,
      gistId,
    })
  }
  if (getGistResponse.status === 404) {
    return null
  }
  if (getGistResponse.status !== 200) {
    throw createUnexpectedResponseForUpdateGist({
      response: getGistResponse,
      responseBodyAsJson: await getGistResponse.json(),
    })
  }
  const gist = getGistResponse.json()
  return gist
}

const genericGetGist = async ({ githubToken, gistId }) => {
  const response = await fetchUrl(`https://api.github.com/gists/${gistId}`, {
    headers: {
      authorization: `token ${githubToken}`,
    },
    method: "GET",
  })
  return response
}

const createErrorWhileGettingGist = ({ error, gistId }) =>
  new Error(`error while getting gist.
error: ${error.stack}
gist id: ${gistId}`)

const createUnexpectedResponseForUpdateGist = ({ response, responseBodyAsJson }) =>
  new Error(`get gist failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
