import { generateLighthouseReport } from "../../../index.js"

generateLighthouseReport("https://google.com", {
  projectDirectoryUrl: new URL("../../../", import.meta.url),
  logLevel: "debug",
})
