import { generateCommonJsBundleForNode } from "@jsenv/core"
import * as jsenvConfig from "../../jsenv.config.js"

generateCommonJsBundleForNode({
  ...jsenvConfig,
  bundleDirectoryClean: true,
  bundleDirectoryRelativeUrl: "./dist/action/",
  node: true,
  manifestFile: true,
  entryPointMap: {
    action: "./src/action.js",
  },
})
