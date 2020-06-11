import {
  reportLighthouseScoreMergeImpact,
  readGithubWorkflowEnv,
  // eslint-disable-next-line import/no-unresolved
} from "@jsenv/lighthouse-score-merge-impact"

reportLighthouseScoreMergeImpact({
  ...readGithubWorkflowEnv(),
  logLevel: "debug",
})
