import { generateLighthouseReport } from "../../../src/generateLighthouseReport.js"
// import { generateLighthouseReport } from "@jsenv/lighthouse-score-merge-impact"

export default generateLighthouseReport("http://google.com", {
  projectDirectoryUrl: new URL("../../../", import.meta.url),
  logLevel: "debug",
})
