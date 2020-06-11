import { generateLighthouseReport } from "../../../src/generateLighthouseReport.js"

export default generateLighthouseReport("http://google.com", {
  projectDirectoryUrl: new URL("../../../", import.meta.url),
  logLevel: "debug",
})
