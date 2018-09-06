const path = require('path')

const _ = require('../utils')
const config = require('../config').customComponent

const now = new Date()
const templateDir = _.getTemplateDir()
const templateProject = path.join(templateDir, config.name)
const globOptions = {
  cwd: templateProject,
  nodir: true,
  dot: true,
}

/**
 * 拷贝 package.json
 */
async function copyPackageJson(dirPath, options) {
  let content = await _.readFile(path.join(templateProject, 'package.json'))

  content = content.replace(/("name": ")(?:.*)(")/ig, `$1${options.name}$2`)
  content = content.replace(/("version": ")(?:.*)(")/ig, `$1${options.version}$2`)
  content = content.replace(/("url": ")(?:.*)(")/ig, `$1${options.git}$2`)
  content = content.replace(/("author": ")(?:.*)(")/ig, `$1${options.author}$2`)
  content = content.replace(/("miniprogram": ")(?:.*)(")/ig, `$1${options.dist}$2`)
  content = content.replace(/("main": ")(?:.*)(")/ig, `$1${options.dist}/index.js$2`)

  await _.writeFile(path.join(dirPath, 'package.json'), content)
}

/**
 * 拷贝 license
 */
async function copyLicense(dirPath, options) {
  let content = await _.readFile(path.join(templateProject, 'LICENSE'))

  content = content.replace(/(Copyright\s+\(c\)\s+)(?:.*)(\s*[\r\n])/ig, `$1${now.getFullYear()} ${options.author}$2`)

  await _.writeFile(path.join(dirPath, 'LICENSE'), content)
}

/**
 * 拷贝其他文件
 */
async function copyOthers(dirPath) {
  // src 目录
  const srcFiles = await _.globSync('src/**/*', globOptions)

  // test 目录
  const testFiles = await _.globSync('test/**/*', globOptions)

  // tools 目录
  const toolsFiles = await _.globSync('tools/**/*', globOptions)

  // 其他根目录下的文件，如 .gitignore 等
  let rootFiles = await _.globSync('*', globOptions)
  rootFiles = rootFiles.filter(toolsFile => toolsFile.slice(-12) !== 'package.json' && toolsFile.slice(-7) !== 'LICENSE')

  const allFiles = [].concat(srcFiles, testFiles, toolsFiles, rootFiles)
  for (let i = 0, len = allFiles.length; i < len; i++) {
    const filePath = allFiles[i]
    // eslint-disable-next-line no-await-in-loop
    await _.copyFile(path.join(templateProject, filePath), path.join(dirPath, filePath))
  }
}

/**
 * 执行初始化命令
 */
async function init(dirPath, options) {
  if (options.newest) {
    // 删除模板，为了拉取新模板
    await _.removeDir(templateProject)
  }

  // 拉取模板
  await _.downloadTemplate(config, options.proxy)

  const isTemlateExist = await _.checkDirExist(templateProject)

  if (!isTemlateExist) {
    // eslint-disable-next-line no-console
    console.log('can not download the template project, please check your internet connection.')
    process.exit(1)
  }

  await _.recursiveMkdir(dirPath)

  await copyPackageJson(dirPath, options)
  await copyLicense(dirPath, options)

  await copyOthers(dirPath)
}

module.exports = function (dirPath, options = {}) {
  init(dirPath, options)
    // eslint-disable-next-line no-console
    .then(() => console.log(`[init done]: ${dirPath}`))
    // eslint-disable-next-line no-console
    .catch(err => console.error(err))
}
