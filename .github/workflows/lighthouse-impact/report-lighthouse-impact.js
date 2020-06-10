import { reportLighthouseScoreMergeImpact, readGithubWorkflowEnv } from "../../../index.js"

reportLighthouseScoreMergeImpact(
  async () => {
    const namespace = await import("./generate-lighthouse-report.js")
    return namespace.default
  },
  {
    ...readGithubWorkflowEnv(),
    logLevel: "debug",
  },
)
