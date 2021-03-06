/**

https://github.com/actions/toolkit/tree/master/packages/exec
https://github.com/actions/toolkit/tree/master/packages/core

*/

import { writeFile, resolveUrl, readFile } from "@jsenv/util"
import { generateCommentBody } from "../src/internal/generateCommentBody.js"

const normalReport = await readFile(
  new URL("./lighthouse-report-examples/normal.json", import.meta.url),
  { as: "json" },
)

const examples = {
  basic: generateCommentBody({
    baseReport: {
      audits: {
        whatever: {
          score: 0.5,
          scoreDisplayMode: "numeric",
          description: "whatever description",
        },
        foo: {
          score: 0,
          scoreDisplayMode: "binary",
          description: "foo description",
        },
      },
      categories: {
        perf: {
          score: 0.8,
          auditRefs: [{ id: "whatever" }, { id: "foo" }],
          description: "Total perf score",
        },
      },
    },
    afterMergeReport: {
      audits: {
        whatever: {
          score: 0.7,
          scoreDisplayMode: "numeric",
        },
        foo: {
          score: 1,
          scoreDisplayMode: "binary",
          description: "foo description",
        },
      },
      categories: {
        perf: {
          score: 0.9,
        },
      },
    },
    baseGist: { id: "base" },
    afterMergeGist: { id: "head" },
    pullRequestBase: "base",
    pullRequestHead: "head",
  }),
  versionMismatch: generateCommentBody({
    baseReport: {
      lighthouseVersion: "1.0.0",
    },
    afterMergeReport: {
      lighthouseVersion: "1.0.1",
    },
    baseGist: { id: "base" },
    afterMergeGist: { id: "head" },
    pullRequestBase: "base",
    pullRequestHead: "head",
  }),
  real: generateCommentBody({
    baseReport: normalReport,
    afterMergeReport: normalReport,
    baseGist: { id: "base" },
    afterMergeGist: { id: "head" },
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
