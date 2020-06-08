import { importMetaURLToFolderPath } from "@jsenv/operating-system-path"
import {
  lighthousePullRequestCommentFromTravisBuild,
  generateLighthouseReport,
} from "../../index.js"

process.env.TRAVIS_EVENT_TYPE = "pull_request"
process.env.TRAVIS_PULL_REQUEST_SLUG = "damiflore/mille-sabords"
process.env.TRAVIS_PULL_REQUEST = "5"
process.env.GITHUB_API_TOKEN = ""

const projectPath = importMetaURLToFolderPath(import.meta.url)

lighthousePullRequestCommentFromTravisBuild({
  projectPath,
  lighthouseReportRelativePath: "/lighthouse-report.json",
  getLighthouseProductionReport: () =>
    generateLighthouseReport({
      url: "https://mille-sabords.herokuapp.com/",
    }),
})
