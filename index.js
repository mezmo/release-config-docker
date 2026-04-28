'use strict'

const core = require('@mezmoinc/release-config-core')
const remap = require('./lib/plugins/remap.js')

const config = {
  ...core
, npmPublish: false
, dockerLogin: true
, dockerTags: [
    '{{#unless (eq channel "beta")}}{{major}}-latest{{/unless}}'
  , '{{#unless (eq channel "beta")}}{{major}}.{{minor}}-latest{{/unless}}'
  , '{{version}}'
  , '{{#unless (eq channel "beta")}}automated-security-scan{{/unless}}'
  ]
, dockerFile: 'Dockerfile'
, dockerArgs: {
    BUILD_DATE: '{{now}}'
  , BUILD_VERSION: '{{git_tag}}'
  , VCR_REF: '{{pkg.repository.url}}'
  , REPO: '{{pkg.name}}'
  }
, plugins: remap(core.plugins)
}

module.exports = config
module.exports.default = config
