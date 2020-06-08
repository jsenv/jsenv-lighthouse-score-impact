# lighthouse-report

[![npm package](https://img.shields.io/npm/v/@dmail/lighthouse-report.svg)](https://www.npmjs.com/package/@dmail/lighthouse-report)
[![build](https://travis-ci.com/dmail/lighthouse-report.svg?branch=master)](http://travis-ci.com/dmail/lighthouse-report)
[![codecov](https://codecov.io/gh/dmail/lighthouse-report/branch/master/graph/badge.svg)](https://codecov.io/gh/lighthouse/lighthouse-report)

WORK IN PROGRESS, DOCUMENTATION OUTDATED.

> Generate lighthouse report programmatically. Can also auto comment pull request on github with your lighthouse report.

## Introduction

Thi module has the following exports

- `generateLighthouseReport`
- `commentPullRequestWithLighthouseReport`

## `generateLighthouseReport` example

```js
const { generateLighthouseReport } = require("@dmail/lighthouse-report")

generateLighthouseReport({
  url: "http://google.com",
  projectPath: __dirname,
  jsonReportRelativePath: "/lighthouse-report.json",
  htmlReportRelativePath: "/lighthouse-report.html",
})
```

The code above will create two files in the current directory corresponding to lighthouse report for `http://google.com`

## `commentPullRequestWithLighthouseReport` example

```js
const { readFileSync } = require("fs")
const { commentPullRequestWithLighthouseReport } = require("@dmail/lighthouse-report")

const lighthouseReport = JSON.parse(String(readFileSync(`${__dirname}/lighthouse-report.json`)))
const lighthouseProductionReport = JSON.parse(
  String(readFileSync(`${__dirname}/lighthouse-production-report.json`)),
)

commentPullRequestWithLighthouseReport({
  githubApiToken: process.env.GITHUB_API_TOKEN,
  repositoryOwner: "dmail",
  repositoryName: "lighthouse-report",
  pullRequestNumber: 5,
  lighthouseReport,
  lighthouseProductionReport,
})
```

The code above will search in your github repository pull request for a comment about lighthouse report.

When the comment does not exists:

- it creates a gist
- then it create a comment in your pull request with a link to view your lighthouse report

When the comment exists:

- it updates the gist
- it updates the comment on the pull request with latest data

This function is meant to be runned every time you push a commit on a pull request.
You have to setup how to call it and provide `pullRequestNumber`.

#### List of things to know

- If you pass `lighthouseProductionReport`, the comment contains score diff between your pull request and production.<br/>
- To create a `githubApiToken` go to https://github.com/settings/tokens.
- `gihubApiToken` must be allowed to read/write gists and read/write comments.
- The gist created is secret and owned by the owner of `githubApiToken`.
- The pull request comment is made by the owner of `githubApiToken`.
- If you use travis you can use the undocumented `lighthousePullRequestCommentFromTravisBuild` export.<br />
  — see [source](./src/pull-request-comment/lighthousePullRequestCommentFromTravisBuild.js)

## Installation

```console
npm install @dmail/lighthouse-report@2.0.0
```
