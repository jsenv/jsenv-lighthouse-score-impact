import { reportLighthouseScoreImpact, readGithubWorkflowEnv } from "@jsenv/lighthouse-score-impact"

reportLighthouseScoreImpact({
  ...readGithubWorkflowEnv(),
  jsonFileGenerateCommand: "npm run generate-lighthouse-report",
})
