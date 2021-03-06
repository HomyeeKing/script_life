#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec, execSync, spawn } = require('child_process')
const cac = require('cac')
const prompts = require('prompts')
const pkg = require('./package.json')

const cli = cac('switch-helper')

const isWin = os.platform() === 'win32'
const homePath = isWin ? process.env.USERPROFILE : process.env.HOME

const resolve = name => path.resolve(__dirname, name)
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
    initial: prev => `${prev.replace(/ /g, '')}@`,
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
    initial: prev => `${prev.replace(/ /g, '')}@`,
    message: 'Please input gitlab user email',
    validate: value => (value === '' ? 'required!' : true)
  }
]

async function macInit() {
  await createGitAcFile()
  // chmod the template, because we need to make the hooks file executable
  //   reference:https://stackoverflow.com/questions/8598639/why-is-my-git-pre-commit-hook-not-executable-by-default
  execSync(`chmod -R u+x ${resolve('templates')}`, (err) => {
    console.log(`
      the git hooks file is not executable,please report it to ${pkg.bugs.url}
       you can run 
      >$ chmod -R u+x ${homePath}/.templates
      for temporal fix`)
    throw err
  })
  copy(resolve('./templates'), homePath)
  console.log(`hooks has been copied into ${homePath}`)
}

cli
  .command('')
  .option('-u, --update', 'update git info')
  .action(async(options) => {
    console.log(`detect that your are on ${isWin ? 'Windows' : 'Mac'}`)
    if (options.u) {
      await createGitAcFile(true)
    }

    if (isWin) {
      // TODO: powershell or bash , this is a question
    } else {
      macInit()
    }
  })

//   install zsh
cli.command('zsh').action(async() => {
  if (fs.existsSync(path.resolve(homePath, '.zshrc'))) {
    const { del } = await prompts({
      type: 'toggle',
      name: 'del',
      message:
        'detect that zsh has been installed, do you want to overwrite it? (y/n)',
      initial: true,
      active: 'yes',
      inactive: 'no'
    })
    if (!del) return
  }

  const zshSh
    = 'sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"'

  exec(zshSh, (err) => {
    if (err) {
      console.log(
        'perhaps you have not installed xcode because zsh depend on it'
      )
      throw err
    }
    console.log('zsh install finished')
  })
})

// ssh RE
cli
  .command('ssh')
  .option('--target <name>', 'Provide platform name')
  .action((options) => {
    const { target } = options
    // run interactive command in node.js
    // see https://stackoverflow.com/a/55044587 for more details
    const ls = spawn('sh', ['ssh.sh', target], { stdio: 'inherit' })

    ls.on('close', () => {
      // TODO: get the path of user input
    })
  })

async function createGitAcFile(update = false) {
  if (update || !fs.existsSync(gitAccountPath)) {
    let cancel = false
    const { githubEmail, githubName, gitlabEmail, gitlabName } = await prompts(
      gitAcQues,
      {
        onCancel: () => {
          cancel = true
          return false
        }
      }
    )
    if (!cancel) {
      const str = `
      githubName="${githubName}"
      githubEmail="${githubEmail}"
      gitlabName="${gitlabName}"
      gitlabEmail="${gitlabEmail}"`.trim()
      fs.writeFileSync(gitAccountPath, str)
      console.log(
        `git account info has already save into ${
          isWin ? '' : '~/.git-account'
        }`
      )
    }
  }
}

// #region utils
/**
 *
 * @param {*} folderPath
 * @param {string[]} filename
 * @param {*} data
 * ???????????????????????????????????????????????????????????????????????????????????????
 */
function copyDir(srcDir, destDir, flags) {
  fs.mkdirSync(destDir, { recursive: true })
  const files = fs.readdirSync(srcDir)
  for (const file of files) {
    const srcFile = path.join(srcDir, file)
    const destFile = path.join(destDir, file)
    copy(srcFile, destFile, flags)
  }
}
function copy(src, dest, flags) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest, flags)
  }
}

// #endregion

cli.help()
cli.version(pkg.version)
cli.parse()
