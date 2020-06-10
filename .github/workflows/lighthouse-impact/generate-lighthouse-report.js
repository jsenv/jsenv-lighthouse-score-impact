import { generateLighthouseReport } from "../../../src/generateLighthouseReport.js"

generateLighthouseReport("http://google.com", {
  projectDirectoryUrl: new URL("../../../", import.meta.url),
  logLevel: "debug",
})
