export const createUnexpectedGithubApiTokenError = ({ githubApiToken }) =>
  new TypeError(`githubApiToken must be a string but received ${githubApiToken}`)

export const createUnexpectedRepositoryOwnerError = ({ repositoryOwner }) =>
  new TypeError(`repositoryOwner must be a string but received ${repositoryOwner}`)

export const createUnexpectedRepositoryNameError = ({ repositoryName }) =>
  new TypeError(`repositoryName must be a string but received ${repositoryName}`)

export const createUnexpectedPullRequestNumberError = ({ pullRequestNumber }) =>
  new TypeError(`repositoryOwner must be a number but received ${pullRequestNumber}`)

export const createUnexpectedLighthouseReportError = ({ lighthouseReport }) =>
  new TypeError(`lighthouseReport must be an object but received ${lighthouseReport}`)

export const createUnexpectedLighthouseProductionReportError = ({ lighthouseProductionReport }) =>
  new TypeError(
    `lighthouseProductionReport must be an object but received ${lighthouseProductionReport}`,
  )
