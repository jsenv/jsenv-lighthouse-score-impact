/*

TODO:

faire comme dans filesize impact

faire un comparatif, proposer un lien vers les deux report (celui de la branche et celui apres merge)
pour le comparatif on va commencer tranquilou avec just le score

*/

import { lighthouseReportToScoreMap } from "./lighthouseReportToScoreMap.js"

export const generateCommentBody = ({
  baseReport,
  headReport,
  baseGist,
  headGist,
  pullRequestBase,
  pullRequestHead,
}) => {
  const title = `[light house report](https://googlechrome.github.io/lighthouse/viewer/?gist=${baseGist.id})`
  const scoreMarkdown = headReport
    ? generateLightHouseReportDiffMarkdown(baseReport, headReport)
    : generateLightHouseReportMarkdown(baseReport)

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
