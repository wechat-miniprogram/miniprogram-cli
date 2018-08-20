const path = require('path')

const _ = require('./utils')

const now = new Date()
const templateDir = _.getTempateDir()
const globOptions = {
  cwd: templateDir,
  nodir: true,
  dot: true,
}

/**
 * copy package.json
 */
async function copyPackageJson(dirPath, options) {
  let content = await _.readFile(path.join(templateDir, 'package.json'))

  content = content.replace(/("name": ")(?:.*)(")/ig, `$1${options.name}$2`)
  content = content.replace(/("version": ")(?:.*)(")/ig, `$1${options.version}$2`)
  content = content.replace(/("url": ")(?:.*)(")/ig, `$1${options.git}$2`)
  content = content.replace(/("author": ")(?:.*)(")/ig, `$1${options.author}$2`)
  content = content.replace(/("miniprogram": ")(?:.*)(")/ig, `$1${options.dist}$2`)
  content = content.replace(/("main": ")(?:.*)(")/ig, `$1${options.dist}/index.js$2`)

  await _.writeFile(path.join(dirPath, 'package.json'), content)
}

/**
 * copy license
 */
async function copyLicense(dirPath, options) {
  let content = await _.readFile(path.join(templateDir, 'LICENSE'))

  content = content.replace(/(Copyright\s+\(c\)\s+)(?:.*)(\s*[\r\n])/ig, `$1${now.getFullYear()} ${options.author}$2`)

  await _.writeFile(path.join(dirPath, 'LICENSE'), content)
}

/**
 * copy other files
 */
async function copyOthers(dirPath) {
  // src dir
  const srcFiles = await _.globSync('src/**/*', globOptions)

  // test dir
  const testFiles = await _.globSync('test/**/*', globOptions)

  // tools dir
  const toolsFiles = await _.globSync('tools/**/*', globOptions)

  // root files without package.json and license
  let rootFiles = await _.globSync('*', globOptions)
  rootFiles = rootFiles.filter(toolsFile => toolsFile.slice(-12) !== 'package.json' && toolsFile.slice(-7) !== 'LICENSE')

  const allFiles = [].concat(srcFiles, testFiles, toolsFiles, rootFiles)
  for (let i = 0, len = allFiles.length; i < len; i++) {
    const filePath = allFiles[i]
    // eslint-disable-next-line no-await-in-loop
    await _.copyFile(path.join(templateDir, filePath), path.join(dirPath, filePath))
  }
}

/**
 * run init command
 */
async function init(dirPath, options) {
  await _.downloadTemplate(options.proxy)
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
