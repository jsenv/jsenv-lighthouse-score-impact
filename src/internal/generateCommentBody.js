/*

*/

import { formatNumericDiff } from "./formatNumericDiff.js"

export const GENERATED_BY_COMMENT = "<!-- Generated by @jsenv/lighthouse-score-merge-impact -->"

export const generateCommentBody = ({
  headerMessages = [],
  baseReport,
  baseGist,
  afterMergeReport,
  afterMergeGist,
  pullRequestBase,
  pullRequestHead,
}) => {
  const baseVersion = baseReport.lighthouseVersion
  const afterMergeVersion = afterMergeReport.lighthouseVersion
  let impactAnalysisEnabled = true
  if (baseVersion !== afterMergeVersion) {
    impactAnalysisEnabled = false
    headerMessages.push(
      `**Warning:** Impact analysis skipped because lighthouse version are different on \`${pullRequestBase}\` (${baseVersion}) and \`${pullRequestHead}\` (${afterMergeVersion}).`,
    )
  }

  return `${GENERATED_BY_COMMENT}
${baseGist ? `<!-- base-gist-id=${baseGist.id} -->` : ``}
${afterMergeGist ? `<!-- after-merge-gist-id=${afterMergeGist.id} -->` : ``}
<h3>Lighthouse score merge impact</h3>

${renderHeader(headerMessages)}
${
  impactAnalysisEnabled
    ? renderBody({ baseReport, afterMergeReport, pullRequestBase, pullRequestHead })
    : ""
}
${renderFooter({ baseGist, afterMergeGist, pullRequestBase, pullRequestHead })}`
}

const renderHeader = (headerMessages) => {
  if (headerMessages.length === 0) {
    return ""
  }

  return `---

${headerMessages.join(`

`)}

---`
}

const renderBody = ({ baseReport, afterMergeReport, pullRequestBase, pullRequestHead }) => {
  return Object.keys(baseReport.categories).map((categoryName) => {
    return renderCategory(categoryName, {
      baseReport,
      afterMergeReport,
      pullRequestBase,
      pullRequestHead,
    })
  }).join(`

`)
}

const renderCategory = (
  category,
  { baseReport, afterMergeReport, pullRequestBase, pullRequestHead },
) => {
  const baseDisplayedScore = scoreToDisplayedScore(baseReport.categories[category].score)
  const afterMergeDisplayedScore = scoreToDisplayedScore(
    afterMergeReport.categories[category].score,
  )
  const diff = afterMergeDisplayedScore - baseDisplayedScore
  const diffDisplayValue = diff === 0 ? "no impact" : formatNumericDiff(diff)

  return `<details>
  <summary>${category} (${diffDisplayValue})</summary>
  ${
    category === "performance"
      ? `<br /><blockquote>Keep in mind performance score variation may be caused by external factors. <a href="https://github.com/GoogleChrome/lighthouse/blob/91b4461c214c0e05d318ec96f6585dcca52a51cc/docs/variability.md#score-variability">Learn more</a>.</blockquote>`
      : ""
  }
  ${renderCategoryScore(category, {
    baseReport,
    afterMergeReport,
    pullRequestBase,
    pullRequestHead,
  })}
  ${renderCategoryAudits(category, {
    baseReport,
    afterMergeReport,
    pullRequestBase,
    pullRequestHead,
  })}
</details>`
}

const scoreToDisplayedScore = (floatingNumber) => Math.round(floatingNumber * 100)

const renderCategoryScore = (category, { baseReport, afterMergeReport, pullRequestBase }) => {
  const baseDisplayedScore = scoreToDisplayedScore(baseReport.categories[category].score)
  const afterMergeDisplayedScore = scoreToDisplayedScore(
    afterMergeReport.categories[category].score,
  )
  const diff = afterMergeDisplayedScore - baseDisplayedScore
  const diffDisplayValue = diff === 0 ? "none" : formatNumericDiff(diff)

  return `<h3>Global impact on ${category} score</h3>
  <table>
    <thead>
      <tr>
        <th nowrap>impact</th>
        <th nowrap>${pullRequestBase}</th>
        <th nowrap>after merge</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td nowrap>${diffDisplayValue}</td>
        <td nowrap>${baseDisplayedScore}</td>
        <td nowrap>${afterMergeDisplayedScore}</td>
      </tr>
    </tbody>
  </table>`
}

const renderCategoryAudits = (category, { baseReport, afterMergeReport, pullRequestBase }) => {
  const { auditRefs } = baseReport.categories[category]
  const audits = []
  auditRefs.forEach((auditRef) => {
    const auditId = auditRef.id
    const baseAudit = baseReport.audits[auditId]
    const afterMergeAudit = afterMergeReport.audits[auditId]
    const baseAuditOutput = renderAudit(baseAudit)
    const afterMergeAuditOutput = renderAudit(afterMergeAudit)

    // both are not applicable
    if (baseAuditOutput === null && afterMergeAuditOutput === null) {
      return
    }

    // becomes applicable
    if (baseAuditOutput === null && afterMergeAuditOutput !== null) {
      audits.push([
        `<td nowrap>${auditId}</td>`,
        `<td nowrap>---</td>`,
        `<td nowrap>---</td>`,
        `<td nowrap>${afterMergeAuditOutput}</td>`,
      ])
      return
    }

    // becomes unapplicable
    if (baseAuditOutput !== null && afterMergeAuditOutput === null) {
      audits.push([
        `<td nowrap>${auditId}</td>`,
        `<td nowrap>---</td>`,
        `<td nowrap>${baseAuditOutput}</td>`,
        `<td nowrap>---</td>`,
      ])
      return
    }

    if (typeof baseAuditOutput === "number" && typeof afterMergeAuditOutput === "number") {
      const diff = afterMergeAuditOutput - baseAuditOutput

      audits.push([
        `<td nowrap>${auditId}</td>`,
        `<td nowrap>${diff === 0 ? "none" : formatNumericDiff(diff)}</td>`,
        `<td nowrap>${baseAuditOutput}</td>`,
        `<td nowrap>${afterMergeAuditOutput}</td>`,
      ])
      return
    }

    audits.push([
      `<td nowrap>${auditId}</td>`,
      `<td nowrap>${baseAuditOutput === afterMergeAuditOutput ? "none" : "---"}</td>`,
      `<td nowrap>${baseAuditOutput}</td>`,
      `<td nowrap>${afterMergeAuditOutput}</td>`,
    ])
  })

  return `<h3>Detailed impact on ${category} score</h3>
  <table>
    <thead>
      <tr>
        <th nowrap>${category} audit</th>
        <th nowrap>impact</th>
        <th nowrap>${pullRequestBase}</th>
        <th nowrap>after merge</th>
      </tr>
    </thead>
    <tbody>
      <tr>${audits.map(
        (cells) => `
        ${cells.join(`
        `)}`,
      ).join(`
      </tr>
      <tr>`)}
      </tr>
    </tbody>
  </table>`
}

const renderAudit = (audit) => {
  const { scoreDisplayMode } = audit

  if (scoreDisplayMode === "manual") {
    return null
  }

  if (scoreDisplayMode === "notApplicable") {
    return null
  }

  if (scoreDisplayMode === "informative") {
    const { displayValue } = audit
    if (typeof displayValue !== "undefined") return displayValue

    const { numericValue } = audit
    if (typeof numericValue !== "undefined") return numericValue

    return null
  }

  if (scoreDisplayMode === "binary") {
    const { score } = audit
    return score ? "✔" : "☓"
  }

  if (scoreDisplayMode === "numeric") {
    const { score } = audit
    return scoreToDisplayedScore(score)
  }

  return null
}

const renderFooter = ({ baseGist, afterMergeGist, pullRequestBase }) => {
  return `${
    baseGist
      ? `<sub>
  Impact analyzed comparing <a href="${gistIdToReportUrl(
    baseGist.id,
  )}">${pullRequestBase} report</a> and <a href="${gistIdToReportUrl(
          afterMergeGist.id,
        )}">report after merge</a>
</sub>
<br />`
      : ``
  }
<sub>
  Generated by <a href="https://github.com/jsenv/jsenv-lighthouse-score-merge-impact">lighthouse score merge impact</a>
</sub>`
}

const gistIdToReportUrl = (gistId) => {
  return `https://googlechrome.github.io/lighthouse/viewer/?gist=${gistId}`
}
