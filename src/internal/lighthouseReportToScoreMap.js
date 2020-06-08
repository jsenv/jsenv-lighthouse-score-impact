export const lighthouseReportToScoreMap = ({ categories }) => {
  const scoreMap = {}
  Object.keys(categories).forEach((categoryName) => {
    const score = categories[categoryName].score
    scoreMap[categoryName] = score
  })
  return scoreMap
}
