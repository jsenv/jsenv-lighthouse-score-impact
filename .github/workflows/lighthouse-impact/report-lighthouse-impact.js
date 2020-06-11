import {
  reportLighthouseScoreMergeImpact,
  readGithubWorkflowEnv,
  // eslint-disable-next-line import/no-unresolved
} from "@jsenv/lighthouse-score-merge-impact"

reportLighthouseScoreMergeImpact(
  async () => {
    // j'ai peur que cet import dynamique ne soit mis en cache par node
    // et que si on le ré-éxecute il retourne exactement la meme chose
    // https://github.com/nodejs/modules/issues/307
    // https://github.com/nodejs/help/issues/1399
    const namespace = await import(`./generate-lighthouse-report.js?i=${process.hrtime()[0]}`)
    return namespace.default
  },
  {
    ...readGithubWorkflowEnv(),
    logLevel: "debug",
  },
)
