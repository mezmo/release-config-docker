'use strict'

module.exports = remap

function remap(plugins) {
  const remapped = []

  // make sure docker stuff is after the custom scripts (exec) run
  for (const [name, config] of plugins) {
    if (name === '@semantic-release/exec') {
      remapped.push(
        [name, config]
      , ['@codedependant/semantic-release-docker', null]
      )
      continue
    }
    remapped.push([name, config])
  }

  return remapped
}
