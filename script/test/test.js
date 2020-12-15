import { executeTestPlan, launchNode } from "@jsenv/core"
import * as jsenvConfig from "../../jsenv.config.js"

executeTestPlan({
  ...jsenvConfig,
  testPlan: {
    "test/**/*.test.js": {
      node: {
        launch: launchNode,
      },
    },
    "test/**/generateLighthouseReport.test.js": {
      node: {
        launch: launchNode,
        allocatedMs: 80 * 1000,
      },
    },
  },
})
