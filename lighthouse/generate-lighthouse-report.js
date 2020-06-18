import { generateLighthouseReport } from "../index.js"

generateLighthouseReport("https://reactjs.org", {
  projectDirectoryUrl: new URL("../../../", import.meta.url),
  logLevel: "debug",
})
