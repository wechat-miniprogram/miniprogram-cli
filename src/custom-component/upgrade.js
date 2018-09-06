const path = require('path')

const _ = require('../utils')
const config = require('../config').customComponent

const templateDir = _.getTemplateDir()
const templateProject = path.join(templateDir, config.name)
const globOptions = {
  cwd: templateProject,
  nodir: true,
  dot: true,
}

/**
 * check override
 */
function checkOverride(type, override) {
  for (let i = 0, len = override.length; i < len; i++) {
    if (override[i].indexOf(type) === 0) return true
  }

  return false
}

/**
 * 升级 package.json
 */
async function upgradePackageJson(dirPath) {
  const newJsonPath = path.join(templateProject, 'package.json')
  const oldJsonPath = path.join(dirPath, 'package.json')

  // eslint-disable-next-line import/no-dynamic-require
  const newJson = require(newJsonPath)
  // eslint-disable-next-line import/no-dynamic-require
  const oldJson = require(oldJsonPath)

  // 只覆盖 scripts、jest、devDependencies 三个字段
  oldJson.scripts = newJson.scripts
  oldJson.jest = newJson.jest
  oldJson.devDependencies = newJson.devDependencies

  await _.writeFile(oldJsonPath, JSON.stringify(oldJson, null, '\t'))
}

/**
 * 覆盖其他文件
 */
// eslint-disable-next-line complexity
async function copyOthers(dirPath, options) {
  const override = options.override || []
  let config = []
  let testUtils = []
  let otherTools = []
  let otherTestTools = []
  let otherConfig = []
  let demo = []
  let ignore = []

  // 构建配置文件
  if (options.force || checkOverride('tools/config.js', override)) {
    config = await _.globSync('tools/config.js', globOptions)
  }

  // 测试框架工具包
  if (options.force || checkOverride('test/utils.js', override)) {
    testUtils = await _.globSync('test/utils.js', globOptions)
  }

  // 其他构建相关文件
  if (options.force || checkOverride('other tools files', override)) {
    otherTools = await _.globSync('tools/*', globOptions)
    otherTestTools = await _.globSync('tools/test/*', globOptions)

    otherTools = otherTools.filter(otherTool => otherTool.slice(-9) !== 'config.js')
  }

  // 其他构建相关配置文件
  if (options.force || checkOverride('other config files', override)) {
    const babel = await _.globSync('./.babelrc', globOptions)
    const eslint = await _.globSync('./.eslintrc.js', globOptions)

    otherConfig = [babel[0], eslint[0]]
  }

  // demo
  if (options.force || checkOverride('tools/demo', override)) {
    demo = await _.globSync('tools/demo/**/*', globOptions)
  }

  // ignore 相关配置文件
  if (options.force || checkOverride('ignore config', override)) {
    const gitignore = await _.globSync('./.gitignore', globOptions)
    const npmignore = await _.globSync('./.npmignore', globOptions)

    ignore = [gitignore[0], npmignore[0]]
  }

  // eslint-disable-next-line max-len
  const allFiles = [].concat(config, testUtils, otherTools, otherTestTools, otherConfig, demo, ignore)
  for (let i = 0, len = allFiles.length; i < len; i++) {
    const filePath = allFiles[i]

    // eslint-disable-next-line no-await-in-loop
    if (filePath) await _.copyFile(path.join(templateProject, filePath), path.join(dirPath, filePath))
  }
}

/**
 * 执行升级命令
 */
async function upgrade(dirPath, options) {
  // 删除旧模板，拉取新模板
  await _.removeDir(templateProject)
  await _.downloadTemplate(config, options.proxy)

  const isTemlateExist = await _.checkDirExist(templateProject)

  if (!isTemlateExist) {
    // eslint-disable-next-line no-console
    console.log('can not download the template project, please check your internet connection.')
    process.exit(1)
  }

  const override = options.override || []

  if (options.force || checkOverride('package.json', override)) {
    await upgradePackageJson(dirPath)
  }

  await copyOthers(dirPath, options)
}

module.exports = function (dirPath, options = {}) {
  upgrade(dirPath, options)
    // eslint-disable-next-line no-console
    .then(() => console.log(`[upgrade done]: ${dirPath}`))
    // eslint-disable-next-line no-console
    .catch(err => console.error(err))
}
