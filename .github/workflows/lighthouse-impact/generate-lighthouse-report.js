// eslint-disable-next-line import/no-unresolved
import { generateLighthouseReport } from "@jsenv/lighthouse-score-merge-impact"

generateLighthouseReport("https://google.com", {
  projectDirectoryUrl: new URL("../../../", import.meta.url),
  logLevel: "debug",
})
