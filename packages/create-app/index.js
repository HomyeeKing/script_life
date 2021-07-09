#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const cac = require('cac')
const prompts = require('prompts')

const cli = cac('homy')

const cwd = process.cwd()

/**
 *
 * @param {*} folderPath
 * @param {string[]} filename
 * @param {*} data
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

/**
 * empty the dir then remove the emptied dir
 * @param {sting} dir target dir path
 * @returns
 */
function emptyDir(dir) {
  if (!fs.existsSync(dir)) return
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const abs = path.resolve(dir, file)
    if (fs.lstatSync(abs).isDirectory()) {
      emptyDir(abs)
      fs.rmdirSync(abs)
    } else {
      fs.unlinkSync(abs)
    }
  }
}

const questions = [
  {
    type: 'select',
    name: 'template',
    message: 'Pick a template:',
    choices: [
      { title: 'vanilla-ts', description: 'plain ts', value: 'vanilla-ts' }
    ]
  }
]

cli.command('create <name>').action(async(name) => {
  const folderPath = path.join(cwd, name.trim())
  let res = {}
  if (fs.existsSync(folderPath)) {
    const { del } = await prompts({
      type: 'toggle',
      name: 'del',
      message:
        'the target folder has already existed, do you want to overwrite it? (y/n)',
      initial: true,
      active: 'yes',
      inactive: 'no'
    })
    if (del) {
      emptyDir(folderPath)
    } else return
  }
  res = await prompts(questions)

  const { template } = res

  /**
   * 1. write content to the specific file
   * @param {*} file
   * @param {*} content
   */
  const write = (file, content) => {
    const abs = path.resolve(folderPath, file)
    if (content) {
      fs.writeFileSync(abs, content)
    }
  }

  const templateDir = path.join(__dirname, `template-${template}`)
  copy(templateDir, folderPath)

  //  replace package.json name with your own name
  const pkg = require(path.resolve(folderPath, 'package.json'))
  pkg.name = name
  write('package.json', JSON.stringify(pkg, null, 2))
  const pkgManager = /yarn/.test(process.env.npm_execpath) ? 'yarn' : 'npm'

  console.log('\nDone. Now run:\n')
  if (folderPath !== cwd) {
    console.log(`  cd ${path.relative(cwd, folderPath)}`)
  }
  console.log(`  ${pkgManager === 'yarn' ? 'yarn' : 'npm install'}`)
  console.log(`  ${pkgManager === 'yarn' ? 'yarn dev' : 'npm run dev'}`)
  console.log()
})

cli.parse()
