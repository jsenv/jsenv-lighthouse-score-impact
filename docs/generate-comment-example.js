/**

https://github.com/actions/toolkit/tree/master/packages/exec
https://github.com/actions/toolkit/tree/master/packages/core

*/

import { writeFile, resolveUrl } from "@jsenv/util"
import { generateCommentBody } from "../src/internal/generateCommentBody.js"

const examples = {
  basic: generateCommentBody({
    baseReport: {
      categories: {
        perf: { score: 0.5 },
      },
    },
    headReport: {
      categories: {
        perf: { score: 0.7 },
      },
    },
    baseGist: { id: "base" },
    headGist: { id: "head" },
    pullRequestBase: "base",
    pullRequestHead: "head",
  }),
}

const exampleFileUrl = resolveUrl("./comment-example.md", import.meta.url)
const exampleFileContent = Object.keys(examples).map((exampleName) => {
  return `# ${exampleName}

${examples[exampleName]}`
}).join(`

`)

export const promise = writeFile(
  exampleFileUrl,
  `${exampleFileContent}
`,
)
