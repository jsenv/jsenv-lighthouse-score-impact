import { reportLighthouseScoreImpact, readGithubWorkflowEnv } from "../index.js"

reportLighthouseScoreImpact({
  ...readGithubWorkflowEnv(),
  logLevel: "debug",
})
