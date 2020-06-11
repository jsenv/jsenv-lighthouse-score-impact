import { reportLighthouseScoreMergeImpact, readGithubWorkflowEnv } from "../../../index.js"

reportLighthouseScoreMergeImpact({
  ...readGithubWorkflowEnv(),
  logLevel: "debug",
})
