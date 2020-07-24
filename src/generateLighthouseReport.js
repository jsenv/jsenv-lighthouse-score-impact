// https://github.com/GoogleChrome/lighthouse/blob/5a14deb5c4e0ec4e8e58f50ff72b53851b021bcf/docs/readme.md#using-programmatically

import { createRequire } from "module"
import { createLogger } from "@jsenv/logger"
import { createOperation } from "@jsenv/cancellation"
import {
  wrapExternalFunction,
  createCancellationTokenForProcess,
  writeFile,
  resolveUrl,
} from "@jsenv/util"

const require = createRequire(import.meta.url)

const lighthouse = require("lighthouse")
// eslint-disable-next-line import/no-unresolved
const ReportGenerator = require("lighthouse/lighthouse-core/report/report-generator")
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
  },
) => {
  return wrapExternalFunction(
    async () => {
      const logger = createLogger({ logLevel })
      const chromeFlags = [
        ...(headless ? ["--headless"] : []),
        ...(gpu ? [] : ["--disable-gpu"]),
        ...(sandbox ? [] : ["--no-sandbox"]),
        ...(ignoreCertificateErrors ? [] : ["-ignore-certificate-errors"]),
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
      const results = await createOperation({
        cancellationToken,
        start: () => lighthouse(url, lighthouseOptions, config),
      })
      // use results.lhr for the JS-consumeable output
      // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
      // use results.report for the HTML/JSON/CSV output as a string
      // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
      await chrome.kill()
      const { lhr } = results

      const { runTimeError } = lhr
      if (runTimeError) {
        const error = new Error(runTimeError.message)
        Object.assign(error, runTimeError)
        throw error
      }

      const promises = []
      if (jsonFile) {
        promises.push(
          (async () => {
            const jsonFileUrl = resolveUrl(jsonFileRelativeUrl, projectDirectoryUrl)
            const json = JSON.stringify(lhr, null, "  ")
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
            const html = ReportGenerator.generateReportHtml(lhr)
            await writeFile(htmlFileUrl, html)
            if (htmlFileLog) {
              logger.info(`-> ${htmlFileUrl}`)
            }
          })(),
        )
      }
      await Promise.all(promises)

      return lhr
    },
    { catchCancellation: true, unhandledRejectionStrict: true },
  )
}
