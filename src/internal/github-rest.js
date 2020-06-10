import { fetchUrl } from "@jsenv/server"

export const getGithubRessource = async (url, { githubToken, cancellationToken } = {}) => {
  return sendHttpRequest(url, {
    cancellationToken,
    method: "GET",
    headers: {
      authorization: `token ${githubToken}`,
    },
    responseStatusMap: {
      200: async (response) => {
        const json = await response.json()
        return json
      },
      404: () => null,
    },
  })
}

export const postGithubRessource = (url, body, { cancellationToken, githubToken } = {}) => {
  const bodyAsString = JSON.stringify(body)
  return sendHttpRequest(url, {
    cancellationToken,
    method: "POST",
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(bodyAsString),
    },
    body: bodyAsString,
    responseStatusMap: {
      201: async (response) => {
        const json = await response.json()
        return json
      },
    },
  })
}

export const patchGithubRessource = async (url, body, { cancellationToken, githubToken } = {}) => {
  const bodyAsString = JSON.stringify(body)
  return sendHttpRequest(url, {
    cancellationToken,
    method: "PATCH",
    headers: {
      "authorization": `token ${githubToken}`,
      "content-length": Buffer.byteLength(bodyAsString),
    },
    body: bodyAsString,
    responseStatusMap: {
      200: async (response) => {
        const json = await response.json()
        return json
      },
    },
  })
}

const sendHttpRequest = async (
  url,
  { cancellationToken, method, headers, body, responseStatusMap },
) => {
  let response
  try {
    response = await fetchUrl(url, {
      cancellationToken,
      method,
      headers,
      body,
    })
  } catch (error) {
    throw new Error(`network error during request.
--- request method ---
${method}
--- request url ---
${url}
--- error stack ---
${error.stack}`)
  }

  const { status } = response
  if (status in responseStatusMap) {
    return responseStatusMap[response.status](response)
  }

  const responseBodyAsJson = await response.json()
  const error = new Error(`unexpected response status.
--- expected response status ---
${Object.keys(responseStatusMap).join(", ")}
--- response status ---
${response.status}
--- request method ---
${method}
--- request url ---
${url}
--- response json ---
${(JSON.stringify(responseBodyAsJson), null, "  ")}`)
  error.responseStatus = status
  throw error
}
