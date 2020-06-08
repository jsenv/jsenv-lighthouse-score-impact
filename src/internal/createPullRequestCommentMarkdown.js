import { lighthouseReportToScoreMap } from "./lighthouseReportToScoreMap.js"

export const createPullRequestCommentMarkdown = ({
  lighthouseReport,
  lighthouseProductionReport,
  gistId,
}) => {
  const title = `[light house report](https://googlechrome.github.io/lighthouse/viewer/?gist=${gistId})`
  const scoreMarkdown = lighthouseProductionReport
    ? generateLightHouseReportDiffMarkdown(lighthouseReport, lighthouseProductionReport)
    : generateLightHouseReportMarkdown(lighthouseReport)

  return `${title}
---
${scoreMarkdown}`
}

const generateLightHouseReportDiffMarkdown = (lighthouseReport, lighthouseProductionReport) => {
  const scoreMap = lighthouseReportToScoreMap(lighthouseReport)
  const productionScoreMap = lighthouseReportToScoreMap(lighthouseProductionReport)
  return `
Category | Score | Compared to production
-------- | ----- | -----------------------${Object.keys(scoreMap)
    .map((category) => {
      const score = scoreMap[category]
      const productionScore = productionScoreMap[category]
      return `
${category} | ${scoreToDisplayedScore(score)} | ${generateScoreComparisonCell(
        score,
        productionScore,
      )}`
    })
    .join("")}`
}

const generateScoreComparisonCell = (score, productionScore) => {
  const diff = twoDecimalsPrecision(score - productionScore)

  if (diff < 0) return `-${diff}`
  if (diff > 0) return `+${diff}`
  return `same`
}

const generateLightHouseReportMarkdown = (lighthouseReport) => {
  const scoreMap = lighthouseReportToScoreMap(lighthouseReport)
  return `
Category | Score
-------- | -------${Object.keys(scoreMap)
    .map(
      (category) => `
${category} | ${scoreToDisplayedScore(scoreMap[category])}`,
    )
    .join("")}`
}

const scoreToDisplayedScore = (score) => twoDecimalsPrecision(score)

const twoDecimalsPrecision = (floatingNumber) => Math.round(floatingNumber * 100) / 100
