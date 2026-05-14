library 'magic-butler-catalogue'

def PROJECT_NAME = "release-config-docker"
def DEFAULT_BRANCH = 'main'
def TRIGGER_PATTERN = ".*@triggerbuild.*"
def BUILD_SLUG = slugify(env.BUILD_TAG)

def CURRENT_BRANCH = [env.CHANGE_BRANCH, env.BRANCH_NAME]?.find{branch -> branch != null}

def NPMRC = [
    configFile(fileId: 'npmrc', variable: 'NPM_CONFIG_USERCONFIG')
]

pipeline {
  agent {
    node {
      label 'ec2-fleet'
       customWorkspace("/tmp/workspace/${BUILD_SLUG}")
    }
  }

  options {
    timestamps()
    ansiColor 'xterm'
  }

  triggers {
    issueCommentTrigger(TRIGGER_PATTERN)
  }

  tools {
    nodejs 'NodeJS 24'
  }

  stages {
    stage('Setup') {
      steps {
        configFileProvider(NPMRC) {
          sh 'npm install'
        }
      }
    }

    stage('Lint') {
      stages{
        stage("CommitLint") {
          steps {
            // TODO: Add rich checks reporting
            sh 'npm run commitlint'
          }
          post {
            always {
              script {
                if (fileExists('.commitlint/report/checkstyle.json')) {
                  def report = readJSON file: '.commitlint/report/checkstyle.json'
                  publishChecks(
                    name: report.name,
                    title: report.title,
                    summary: report.summary,
                    text: report.text,
                    conclusion: report.conclusion,
                    status: 'COMPLETED',
                  )
                }
              }
            }
          }
        }

        stage("ESLint") {
          steps {
            discoverGitReferenceBuild()
            script {
              withChecks(name: 'eslint') {
                sh 'npm run lint:ci'
                recordIssues(
                  tool: esLint(pattern: '.eslint.json'),
                  id: 'eslint',
                  name: 'eslint',
                  sourceDirectories: [[path: "${WORKSPACE}"]],
                  checksAnnotationScope: 'ALL',
                  minimumSeverity: 'ERROR',
                  qualityGates: [[threshold: 1, type: 'TOTAL', criticality: 'FAILURE']],
                  stopBuild: true
                )
              }
            }
          }
        }
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
      post {
        always {
          sh 'echo running post-test stage' // makes templating easier
          junit testResults: '.tap/test.xml', allowEmptyResults: true
          publishHTML target: [
            allowMissing: false,
            alwaysLinkToLastBuild: false,
            keepAll: true,
            reportDir: '.tap/report',
            reportFiles: '*.html',
            reportName: "coverage-${BUILD_SLUG}"
          ]
        }
      }
    }

    stage('Release Test') {
      environment {
        GIT_BRANCH = "${CURRENT_BRANCH}"
        BRANCH_NAME = "${CURRENT_BRANCH}-dry-run-${BUILD_NUMBER}"
        CHANGE_ID = ""
      }

      when {
        beforeAgent true
        not {
          branch DEFAULT_BRANCH
        }
      }

      steps {
        checkout([
          $class: 'GitSCM',
          branches: scm.branches,
          doGenerateSubmoduleConfigurations: scm.doGenerateSubmoduleConfigurations,
          extensions: scm.extensions + [
            [$class: 'CloneOption', depth: 0, noTags: false, shallow: false],
            [$class: 'PruneStaleBranch']
          ],
          userRemoteConfigs: scm.userRemoteConfigs
        ])
        sh 'npm install'
        sh "git checkout -b ${BRANCH_NAME}"

        withCredentials([
           usernamePassword(
             credentialsId: 'github-app-key-mezmo',
             passwordVariable: 'GITHUB_TOKEN',
             usernameVariable: 'GITHUB_APP'
           ),
           string(
             credentialsId: 'npm-publish-token',
             variable: 'NPM_TOKEN'
           )
        ]) {
          sh "npm run release:dry -- --repository-url=file://${WORKSPACE}"
        }
      }
    }

    stage('Release') {
      environment {
        GIT_AUTHOR_NAME = 'Mezmo Bot'
        GIT_AUTHOR_EMAIL = 'bot@mezmo.com'
        GIT_COMMITTER_NAME = 'Mezmo Bot'
        GIT_COMMITTER_EMAIL = 'bot@mezmo.com'
      }
      when {
        beforeAgent true
        branch DEFAULT_BRANCH
        not {
          changelog '\\[skip ci\\]'
        }
      }

      steps {
        withCredentials([
           usernamePassword(
             credentialsId: 'github-app-key-mezmo',
             passwordVariable: 'GITHUB_TOKEN',
             usernameVariable: 'GITHUB_APP'
           ),
           string(
             credentialsId: 'npm-publish-token',
             variable: 'NPM_TOKEN'
            )
        ]) {
          sh 'npm run release'
        }
      }
    }
  }
}
