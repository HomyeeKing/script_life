const fs = require('fs')
const path = require('path')
const os = require('os')
const cac = require('cac')
const prompts = require('prompts')
const cli = cac('git-cli')

const isWin = os.platform() === 'win32'
const homePath = isWin ? process.env.USERPROFILE : process.env.HOME

console.log(`detect that your are on ${isWin ? 'Windows' : 'Mac'}`)

// check if there's exist a file contain git account info
const gitAccountPath = path.resolve(homePath, '.git-account')

const gitAcQues = [
  {
    type: 'text',
    name: 'githubName',
    message: 'Please input github user name',
    validate: value => (value === '' ? 'required!' : true)
  },
  {
    type: 'text',
    name: 'githubEmail',
    message: 'Please input github user email',
    validate: value => (value === '' ? 'required!' : true)
  },
  {
    type: 'text',
    name: 'gitlabName',
    message: 'Please input gitlab user name',
    validate: value => (value === '' ? 'required!' : true)
  },
  {
    type: 'text',
    name: 'gitlabEmail',
    message: 'Please input gitlab user email',
    validate: value => (value === '' ? 'required!' : true)
  }
]
if (!fs.existsSync(gitAccountPath)) {
  createGitAcFile()
}
cli
  .command('')
  .option('-u, --update', 'update git info')
  .action((options) => {
    if (options.u) {
      createGitAcFile()
    }
  })

async function createGitAcFile() {
  const { githubEmail, githubName, gitlabEmail, gitlabName } = await prompts(
    gitAcQues
  )
  const str = `
    githubName=${githubName}
    githubEmail=${githubEmail}
    gitlabName=${gitlabName}
    gitlabEmail=${gitlabEmail}`.trim()
  fs.writeFileSync(gitAccountPath, str)
}

if (isWin) {
  // TODO: powershell or bash , this is a question
} else {
  copy('./templates', homePath)
}

// #region utils
/**
 *
 * @param {*} folderPath
 * @param {string[]} filename
 * @param {*} data
 * 把一个文件夹的内容拷贝到另一个文件夹下，而不是文件夹的移动
 */
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  const files = fs.readdirSync(srcDir)
  for (const file of files) {
    const srcFile = path.join(srcDir, file)
    const destFile = path.join(destDir, file)
    copy(srcFile, destFile)
  }
}
function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

// #endregion

cli.parse()
