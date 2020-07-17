import { generateLighthouseReport } from "@jsenv/lighthouse-score-impact"

generateLighthouseReport("https://reactjs.org", {
  projectDirectoryUrl: new URL("../../", import.meta.url),
  logLevel: "debug",
})
