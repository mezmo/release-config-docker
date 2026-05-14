'use strict'

const {test, threw} = require('tap')
const base = require('@mezmoinc/release-config-core')
const config = require('../../index.js')

function sortByType(a, b) {
  return a.type < b.type ? -1 : 1
}

test('release-config-docker', async (t) => {
  t.type(config, 'object', 'package exports an object')
  t.equal(config.npmPublish, false, 'npmPublish = false by default')
  t.equal(config.dockerLogin, true, 'dockerLogin = true by default')
  const plugins = config.plugins.map((plugin) => {
    return plugin[0]
  })

  t.same(config.parserOpts, base.parserOpts, 'default commit parser options')

  t.same(
    config.releaseRules.sort(sortByType)
  , base.releaseRules.sort(sortByType)
  , 'expected default release rules'
  )

  t.match(config, {
    dockerLogin: true
  , dockerRegistry: undefined
  , dockerProject: undefined
  , dockerTags: [
      '{{major}}-latest'
    , '{{major}}.{{minor}}-latest'
    , '{{version}}'
    , 'automated-security-scan'
    ]
  , dockerFile: 'Dockerfile'
  , dockerArgs: {
      BUILD_DATE: '{{now}}'
    , BUILD_VERSION: '{{git_tag}}'
    , VCR_REF: '{{pkg.repository.url}}'
    , REPO: '{{pkg.name}}'
    }
  }, 'expected docker config')

  const [git] = config.plugins.filter((plugin) => {
    return plugin[0] === '@semantic-release/git'
  })

  t.ok(git[1].assets.includes('package*.json'), 'git plugin tracks package*.json files')
  t.ok(git[1].assets.includes('Cargo.*'), 'git plugin tracks Cargo.* files')
  t.ok(git[1].assets.includes('crates/*/Cargo.*'), 'git plugin nested Cargo.* files')

  t.same(plugins, [
    '@semantic-release/commit-analyzer'
  , '@semantic-release/release-notes-generator'
  , '@semantic-release/changelog'
  , '@semantic-release/npm'
  , '@semantic-release/exec'
  , '@codedependant/semantic-release-docker'
  , '@semantic-release/git'
  , '@semantic-release/github'
  ], 'expected default plugins')
}).catch(threw)
