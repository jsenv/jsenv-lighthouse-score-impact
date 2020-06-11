import { reportLighthouseScoreMergeImpact, readGithubWorkflowEnv } from "../../../index.js"

reportLighthouseScoreMergeImpact(
  async () => {
    // j'ai peur que cet import dynamique ne soit mis en cache par node
    // et que si on le ré-éxecute il retourne exactement la meme chose
    const namespace = await import("./generate-lighthouse-report.js")
    return namespace.default
  },
  {
    ...readGithubWorkflowEnv(),
    logLevel: "debug",
  },
)
