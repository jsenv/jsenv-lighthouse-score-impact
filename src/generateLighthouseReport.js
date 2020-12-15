// https://github.com/GoogleChrome/lighthouse/blob/5a14deb5c4e0ec4e8e58f50ff72b53851b021bcf/docs/readme.md#using-programmatically

import { createRequire } from "module"
import { createLogger } from "@jsenv/logger"
import {
  createOperation,
  createCancellationTokenForProcess,
  executeAsyncFunction,
} from "@jsenv/cancellation"
import { writeFile, resolveUrl } from "@jsenv/util"

const require = createRequire(import.meta.url)

const lighthouse = require("lighthouse")
// eslint-disable-next-line import/no-unresolved
const ReportGenerator = require("lighthouse/lighthouse-core/report/report-generator")
// eslint-disable-next-line import/no-unresolved
const { computeMedianRun } = require("lighthouse/lighthouse-core/lib/median-run.js")
const chromeLauncher = require("chrome-launcher")

export const generateLighthouseReport = async (
  url,
  {
    cancellationToken = createCancellationTokenForProcess(),
    logLevel,
    projectDirectoryUrl,
    headless = true,
    gpu = false,
    sandbox = false,
    ignoreCertificateErrors = false,
    config = null,
    jsonFile = Boolean(projectDirectoryUrl),
    jsonFileRelativeUrl = "./lighthouse/lighthouse-report.json",
    jsonFileLog = true,
    htmlFile = Boolean(projectDirectoryUrl),
    htmlFileRelativeUrl = "./lighthouse/lighthouse-report.html",
    htmlFileLog = true,
    runCount = 1,
    delayBetweenEachRunInSeconds = 1,
  },
) => {
  return executeAsyncFunction(
    async () => {
      const logger = createLogger({ logLevel })
      const chromeFlags = [
        ...(headless ? ["--headless"] : []),
        ...(gpu ? [] : ["--disable-gpu"]),
        ...(sandbox ? [] : ["--no-sandbox"]),
        ...(ignoreCertificateErrors ? [] : ["--ignore-certificate-errors"]),
        // "--purge_hint_cache_store",
        "--incognito",
        "--disk-cache-size=1",
        // "--disk-cache-dir=/dev/null",
      ]
      const chrome = await createOperation({
        cancellationToken,
        start: () => chromeLauncher.launch({ chromeFlags }),
      })
      const lighthouseOptions = {
        chromeFlags,
        port: chrome.port,
      }

      const reports = []
      await Array(runCount)
        .fill()
        .reduce(async (previous, _, index) => {
          await previous
          if (index > 0 && delayBetweenEachRunInSeconds) {
            await new Promise((resolve) => setTimeout(resolve, delayBetweenEachRunInSeconds * 1000))
          }
          const report = await generateOneLighthouseReport(url, {
            cancellationToken,
            lighthouseOptions,
            config,
          })
          reports.push(report)
        }, Promise.resolve())

      const lighthouseReport = computeMedianRun(reports)
      await chrome.kill()

      const promises = []
      if (jsonFile) {
        promises.push(
          (async () => {
            const jsonFileUrl = resolveUrl(jsonFileRelativeUrl, projectDirectoryUrl)
            const json = JSON.stringify(lighthouseReport, null, "  ")
            await writeFile(jsonFileUrl, json)
            if (jsonFileLog) {
              logger.info(`-> ${jsonFileUrl}`)
            }
          })(),
        )
      }
      if (htmlFile) {
        promises.push(
          (async () => {
            const htmlFileUrl = resolveUrl(htmlFileRelativeUrl, projectDirectoryUrl)
            const html = ReportGenerator.generateReportHtml(lighthouseReport)
            await writeFile(htmlFileUrl, html)
            if (htmlFileLog) {
              logger.info(`-> ${htmlFileUrl}`)
            }
          })(),
        )
      }
      await Promise.all(promises)

      return lighthouseReport
    },
    { catchCancellation: true, considerUnhandledRejectionsAsExceptions: true },
  )
}

const generateOneLighthouseReport = async (
  url,
  { cancellationToken, lighthouseOptions, config },
) => {
  const results = await createOperation({
    cancellationToken,
    start: () => lighthouse(url, lighthouseOptions, config),
  })

  // use results.lhr for the JS-consumeable output
  // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
  // use results.report for the HTML/JSON/CSV output as a string
  // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
  const { lhr } = results

  const { runtimeError } = lhr
  if (runtimeError) {
    const error = new Error(runtimeError.message)
    Object.assign(error, runtimeError)
    throw error
  }

  return lhr
}
