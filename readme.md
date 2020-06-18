# lighthouse-score-impact

Add lighthouse score impact into pull requests.

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-lighthouse-score-impact.svg?label=package&logo=github)](https://github.com/jsenv/jsenv-lighthouse-score-impact/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/lighthouse-score-impact.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/lighthouse-score-impact)
[![workflow status](https://github.com/jsenv/jsenv-lighthouse-score-impact/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-lighthouse-score-impact/actions?workflow=ci)
[![codecov](https://codecov.io/gh/jsenv/jsenv-lighthouse-score-impact/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-lighthouse-score-impact)

# Table of contents

- [Presentation](#Presentation)
- [How it works](#How-it-works)
- [Usage in github workflow](#Usage-in-github-workflow)
- [Usage outside github workflow](#Usage-outside-github-workflow)
- [Lighthouse report viewer](#Lighthouse-report-viewer)

# Presentation

`@jsenv/lighthouse-score-impact` analyses a pull request impact on lighthouse score. This analysis is posted in a comment of the pull request.

The screenshot below shows that comment posted in a pull request.

![screenshot of pull request comment](./docs/comment-collapsed.png)

The comment can be expanded to get more details.

![screenshot of pull request comment expanded](./docs/comment-expanded.png)

# How it works

In order to analyse the impact of a pull request on lighthouse score this project does the following:

1. Checkout pull request base branch
2. Generates a lighthouse report
3. Merge pull request into its base
4. Generates a second lighthouse report.
5. Analyse differences between the two lighthouse reports
6. Post or update comment in the pull request

# Usage in github workflow

You need:

- [@jsenv/lighthouse-score-impact in devDependencies](#Installation-with-npm)
- [A file generating a lighthouse report](#lighthousegenerate-lighthouse-reportjs)
- [The file runned against a pull request](#lighthousereport-lighthouse-score-impactjs)
- [A workflow.yml](#githubworkflowslighthouse-score-impactyml)

## Installation with npm

```console
npm install --save-dev @jsenv/lighthouse-score-impact
```

## lighthouse/generate-lighthouse-report.js

```js
import { createServer } from "http"
import { generateLighthouseReport } from "@jsenv/lighthouse-score-impact"

const server = createServer((request, response) => {
  response.writeHead(200)
  response.end("Hello, World!")
})
server.listen(8080)

generateLighthouseReport("http://127.0.0.1:8080", {
  projectDirectoryUrl: new URL("../", import.meta.url),
  jsonFileRelativeUrl: "./lighthouse/report.json",
})
```

## lighthouse/report-lighthouse-score-impact.js

```js
import { reportLighthouseScoreImpact, readGithubWorkflowEnv } from "@jsenv/lighthouse-score-impact"

reportLighthouseScoreImpact({
  ...readGithubWorkflowEnv(),
  jsonFileGenerateCommand: "node ./lighthouse/generate-lighthouse-report.js",
  jsonFileRelativeUrl: "./lighthouse/report.json",
})
```

## .github/workflows/lighthouse-score-impact.yml

```yml
name: lighthouse-score-impact

on: pull_request

jobs:
  lighthouse-score-impact:
    # Skip workflow for forks because secrets.GITHUB_TOKEN not allowed to post comments
    if: github.event.pull_request.base.repo.full_name == github.event.pull_request.head.repo.full_name
    strategy:
      matrix:
        os: [ubuntu-latest]
        node: [13.12.0]
    runs-on: ${{ matrix.os }}
    name: lighthouse impact
    steps:
        uses: actions/checkout@v2
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node }}
        run: npm install
      - name: Report lighthouse impact
        run: node ./lighthouse/report-lighthouse-score-impact.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

# Usage outside github workflow

When outside a github workflow you must provide `{ projectDirectoryUrl, githubToken, repositoryOwner, repositoryName, pullRequestNumber }` "manually" to `reportLighthouseScoreImpact`.

For Travis it would be something as below.

```js
import { reportLighthouseScoreImpact } from "@jsenv/lighthouse-score-impact"

reportLighthouseScoreImpact({
  projectDirectoryUrl: process.env.TRAVIS_BUILD_DIR,
  githubToken: process.env.GITHUB_TOKEN, // make it available somehow
  repositoryOwner: process.env.TRAVIS_REPO_SLUG.split("/")[0],
  repositoryName: process.env.TRAVIS_REPO_SLUG.split("/")[1],
  pullRequestNumber: process.env.TRAVIS_PULL_REQUEST,

  jsonFileGenerateCommand: "node ./lighthouse/generate-lighthouse-report.js",
  jsonFileRelativeUrl: "./lighthouse/report.json",
})
```

Please note `reportLighthouseScoreImpact` must be called in a state where your git repository has been cloned and you are currently on the pull request branch. Inside github workflow this is done by the following lines in `lighthouse-score-impact.yml`.

```yml
uses: actions/checkout@v2
uses: actions/setup-node@v1
with:
  node-version: ${{ matrix.node }}
run: npm install
```

In your CI you must replicate this, the corresponding commands looks as below:

```console
git init
git remote add origin $GITHUB_REPOSITORY_URL
git fetch --no-tags --prune --depth=1 origin $PULL_REQUEST_HEAD_REF
git checkout origin/$PULL_REQUEST_HEAD_REF
npm install
```

# Lighthouse report viewer

The pull request comment can contain links to see lighthouse reports in [Lighthouse Report Viewer](https://googlechrome.github.io/lighthouse/viewer).

Every github workflow has access to a magic token `secrets.GITHUB_TOKEN`. But this token is not allowed to create gists. We need to update `./.github/workflows/lighthouse-score-impact.yml` to use an other token that will have the rights to create gists.

```diff
- GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+ GITHUB_TOKEN: ${{ secrets.LIGHTHOUSE_GITHUB_TOKEN }}
```

You can generate a new token at https://github.com/settings/tokens/new. That token needs `repo` and `gists` scope. Copy this token and add it to your repository secrets at https://github.com/REPOSITORY_OWNER/REPOSITORY_NAME/settings/secrets/new. For this example the secret is named `LIGHTHOUSE_GITHUB_TOKEN`.
