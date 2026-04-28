## @mezmoinc/release-config-docker

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Semantic release shareable configuration for releasing docker images. This configuration makes use of the
[semantic-release-docker](https://github.com/esatterwhite/semantic-release-docker) plugin to add image build functionality to the release process defined by
[@mezmoinc/release-config-core](https://github.com/mezmo/release-config-core)

## Usage

```json5
// package.json
{
  "release": {
    "branches": ["main"],
    "extends": "@mezmoinc/release-config-docker",
    "dockerImage": "custom-image-name"
  }
}
```

### Monorepos

For monorepos it may be desireable to use the same Dockerfile for multiple deployments.
This is possible by pointing the `dockerfile` option to its location relative to the sub project

```json5
// package.json
{
  "release": {
    "branches": ["main"],
    "extends": "@mezmoinc/release-config-docker",
    "dockerFile": "../../Dockerfile"
  }
}
```

Alternatively

```javascript
// release.config.js
const path = require('path')
module.exports = {
  branches : ['main'],
  extends: '@mezmoinc/release-config-docker',
  dockerFile: path.join(__dirname, '..', '..', 'Dockerfile')
}
```

## Options

| Option                | Description                                                                                                                                 | Default
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------
| `dockerTags`          | _Optional_. An array of strings allowing to specify additional tags to apply to the image. Supports templating                              | [`latest`, `{major}-latest`, `{version}`]                     |
| `dockerImage`         | _Optional_. The name of the image to release.                                                                                               | Parsed from package.json `name` property                      |
| `dockerRegistry`      | _Optional_. The hostname and port used by the the registry in format `hostname[:port]`. Omit the port if the registry uses the default port | `null` (dockerhub)                                            |
| `dockerProject`       | _Optional_. The project or repository name to publish the image to                                                                          | For scoped packages, the scope will be used, otherwise `null` |
| `dockerDockerfile`    | _Optional_. The path, relative to `$PWD` to a Docker file to build the target image with                                                    | `Dockerfile`                                                  |
| `dockerContext`       | _Optional_. A path, relative to `$PWD` to use as the build context A                                                                        | `.`                                                           |
| `dockerLogin`         | _Optional_. Set to false it by pass docker login if the docker daemon is already authorized                                                 | `true`                                                        |
| `dockerArgs`          | _Optional_. Include additional values for docker's `build-arg`. Supports templating                                                         |                                                               |
| `dockerPlatform`      | _Optional_. An array of target platforms to build for. If specified, [buildx][] Will be used to generate the final images                   | `null` (default docker build behavior)                        |
| `dockerPublish`       | _Optional_. Automatically push image tags during the publish phase.                                                                         | `true`

### Tag Template

Handlebars syntax `{{}}` may be used to template values. Dot notation can be used to extract values from objects

| Variable       | Description                                                                              | Type     |
|----------------|------------------------------------------------------------------------------------------|----------|
| `previous`     | Object with `major`, `minor`, `patch` semver information of the last release published.  | `Object` |
| `next`         | Object with `major`, `minor`, `patch` semver information of the release to be published. | `Object` |
| `git_sha`      | The commit SHA of the current release                                                    | `String` |
| `git_tag`      | The git tag of the current release                                                       | `String` |
| `release_type` | The severity type of the current build (`major`, `minor`, `patch`)                       | `String` |
| `relase_notes` | The release notes blob associated with the release                                       | `String` |
| `version`      | Sever string of the version being built                                                  | `String` |
| `major`        | The major version of the next release                                                    | `Number` |
| `minor`        | The minor version of the next release                                                    | `Number` |
| `patch`        | The patch version of the next release                                                    | `Number` |
| `env`          | Environment variables that were set at build time                                        | `Object` |
| `pkg`          | Values parsed from `package.json`                                                        | `Object` |
| `build`        | The Random build hash representing the current execution context                         | `String` |
| `now`          | Current timestamp is ISO 8601 format                                                     | `String` |

### Build Arguments

The build step will be passed a number of default build arguments. If the value of the build argument is `true`
The build argument value will be omitted allowing the value to be pulled from an environment variable

```json5
// package.json

{
  "name": "service-name",
  "release": {
    "extends": "@mezmoinc/release-config-docker",
    "dockerFile": "../../Dockerfile",
    "dockerTags": ["latest", "{{version}}", "{{major}}-latest", "{{major}}.{{minor}}"],
    "dockerRegistry": "docker.io",
    "dockerProject": "mezmo",
    "dockerArgs": {
      "GITHUB_TOKEN": true
    }
  }
}
```

```shell
> export GITHUB_TOKEN=abc123
> docker build -t docker.io/mezmo/service-name --build-arg GITHUB_TOKEN -f ../../Dockerfile .
```

### Template Helpers

The following [handlebars][] template helpers are pre installed

|  Helper name | Description                                                            | Return Type | Example                                                                                    |
|:------------:|------------------------------------------------------------------------|:-----------:|--------------------------------------------------------------------------------------------|
|  `endswith`  | returns true if a string ends with another                             | [Boolean][] | <pre lang="hbs">{{#if (endswith myvar 'ing')}}{{ othervar }}{{/if}}</pre>                  |
|     `eq`     | returns true if two values are strictly equal to each other            | [Boolean][] | <pre lang="hbs">{{#if (eq var_one var_two)}}{{ var_three }}{{/if}}</pre>                   |
|     `gt`     | returns true if the first value is greater than the second             | [Boolean][] | <pre lang="hbs">{{#if (gt var_one var_two)}}{{ var_three }}{{/if}}</pre>                   |
|     `gte`    | returns true if the first value is greater than or equal to the second | [Boolean][] | <pre lang="hbs">{{#if (gte var_one var_two)}}{{ var_three }}{{/if}}</pre>                  |
|  `includes`  | returns true if the input (string \| array) includes the second value  | [Boolean][] | <pre lang="hbs">{{#if (includes some_array 'one')}}{{ var_one }}{{/if}}</pre>              |
|    `lower`   | returns the lower cased varient of the input string                    |  [String][] | <pre lang="hbs">{{ lower my_var }}</pre>                                                   |
|     `lt`     | returns true if the first value is less than the second                | [Boolean][] | <pre lang="hbs">{{#if (lt var_one var_two)}}{{ var_three }}{{/if}}</pre>                   |
|     `lte`    | returns true if the first value is less than or equal to the second    | [Boolean][] | <pre lang="hbs">{{#if (lte var_one var_two)}}{{ var_three }}{{/if}}</pre>                  |
|     `neq`    | returns true if two values are not equal to each other                 | [Boolean][] | <pre lang="hbs">{{#if (neq var_one var_two)}}{{ var_three }}{{/if}}</pre>                  |
|    `pick`    | returns the first non null-ish value. Will treat `false` as a value    |    `any`    | <pre lang="hbs">{{#with (pick var_one, var_two) as \| value \|}}{{ value }}{{/with}}</pre> |
|    `split`   | splits csv values into a javascript array                              |  [Array][]  | <pre lang="hbs">{{#each (split csv_value)}}{{ this }}{{/each}}                             |
| `startswith` | returns true if a string starts with another                           | [Boolean][] | <pre lang="hbs">{{#if (starts myvar 'foo')}}{{ othervar }}{{/if}}</pre>                    |
|    `upper`   | returns the upper cased varient of the input string                    |  [String][] | <pre lang="hbs">{{upper my_var}}</pre>                                                     |



#### Default Build Arguments

| Build Arg           | Description                                                        | Example         |
|---------------------|--------------------------------------------------------------------|-----------------|
| `SRC_DIRECTORY`     | The name of the directory the build is being executed              | `one`           |
| `TARGET_PATH`       | The path to the current src directory relative to the project root | `workspace/one` |
| `NPM_PACKAGE_NAME`  | The name of the current package the build is executing. Sans scope | `package-one`   |
| `NPM_PACKAGE_SCOPE` | The Scope of the current package, if present. Sans `@`             | `scope`         |
| `CONFIG_NAME`       | The name of the image as it is being built. Sans registry.         | `image-name`    |
| `CONFIG_PROJECT`    | The name of the project the docker image will belong to            | `mezmo`         |
| `GIT_SHA`           | The commit SHA of the current release                              | `ec6e214f0`     |
| `GIT_TAG`           | The git tag of the current release                                 | `v1.0.0`        |


## Authors

* [**Eric Satterwhite**](mailto:eric.satterwhite@mezmo.com) &lt;eric.satterwhite@mezmo.com&gt;

[handlebars]: https://handlebarsjs.com
[Boolean]: https://mdn.io/boolean
[String]: https://mdn.io/string
[Array]: https://mdn.io/array
[buildx]: https://docs.docker.com/reference/cli/docker/buildx/build
