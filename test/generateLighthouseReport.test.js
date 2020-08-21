import { createServer } from "http"
import { generateLighthouseReport } from "@jsenv/lighthouse-score-impact"
import { assert } from "@jsenv/assert"

const server = createServer((request, response) => {
  response.writeHead(200, {
    "content-type": "text/html",
  })
  response.end(`<!DOCTYPE html>
<html>
  <head>
    <title>Title</title>
    <meta charset="utf-8" />
    <link rel="icon" href="data:," />
  </head>
  <body>
    Hello, World!
  </body>
</html>`)
})
server.listen(8080)

const actual = await generateLighthouseReport("http://127.0.0.1:8080", {
  projectDirectoryUrl: new URL("../", import.meta.url),
  jsonFile: false,
  htmlFile: false,
  runCount: 2,
})
const expected = actual
assert({ actual, expected })
