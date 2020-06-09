import { fetchUrl } from "@jsenv/server"

export const getGithubRessource = async (url, { githubToken, cancellationToken } = {}) => {
  let response
  try {
    response = await fetchUrl(url, {
      cancellationToken,
      headers: {
        authorization: `token ${githubToken}`,
      },
      method: "GET",
    })
  } catch (error) {
    throw new Error(`error while getting ${url}.
--- error stack ---
${error.stack}`)
  }

  if (response.status === 404) {
    return null
  }

  if (response.status === 200) {
    const bodyAsJson = await response.json()
    return bodyAsJson
  }

  const responseBodyAsJson = await response.json()
  throw new Error(`get failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
}

export const postGithubRessource = async (url, body, { githubToken }) => {
  let response
  try {
    const bodyAsString = JSON.stringify(body)
    response = await fetchUrl(url, {
      headers: {
        "authorization": `token ${githubToken}`,
        "content-length": Buffer.byteLength(bodyAsString),
      },
      method: "POST",
      body: bodyAsString,
    })
  } catch (error) {
    throw new Error(`
error while posting ${url}.
--- error stack ---
${error.stack}`)
  }

  if (response.status === 201) {
    const ressource = await response.json()
    return ressource
  }

  const responseBodyAsJson = await response.json()
  throw new Error(`post failed: response status should be 201.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
}

export const patchGithubRessource = async (url, body, { githubToken }) => {
  let response

  try {
    const bodyAsString = JSON.stringify(body)
    response = await fetchUrl(url, {
      headers: {
        "authorization": `token ${githubToken}`,
        "content-length": Buffer.byteLength(bodyAsString),
      },
      method: "PATCH",
      body: bodyAsString,
    })
  } catch (error) {
    throw new Error(`error while patching ${url}.
--- error stack ---
${error.stack}`)
  }

  if (response.status === 200) {
    const ressource = await response.json()
    return ressource
  }

  const responseBodyAsJson = await response.json()
  throw new Error(`update gist failed: response status should be 200.
--- response url ----
${response.url}
--- response status ---
${response.status}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
}
