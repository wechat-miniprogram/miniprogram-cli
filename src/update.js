const path = require('path')

const _ = require('./utils')

const templateDir = _.getTempateDir()
const globOptions = {
  cwd: templateDir,
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
 * update tools/config.js
 */
async function updateConfig() {
  try {
    // TODO
  } catch (err) {
    // ignore
  }
}

/**
 * update package.json
 */
async function updatePackageJson(dirPath) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const newJson = require(path.join(templateDir, 'package.json'))
    // eslint-disable-next-line import/no-dynamic-require
    const oldJson = require(path.join(dirPath, 'package.json'))

    // TODO
  } catch (err) {
    // ignore
  }
}

/**
 * copy other files
 */
// eslint-disable-next-line complexity
async function copyOthers(dirPath, options) {
  const override = options.override || []
  let testUtils = []
  let otherTools = []
  let otherTestTools = []
  let otherConfig = []
  let demo = []
  let ignore = []

  if (options.force || checkOverride('test/utils.js', override)) {
    testUtils = await _.globSync('test/utils.js', globOptions)
  }

  if (options.force || checkOverride('other tools files', override)) {
    otherTools = await _.globSync('tools/*', globOptions)
    otherTestTools = await _.globSync('tools/test/*', globOptions)

    otherTools = otherTools.filter(otherTool => otherTool.slice(-9) !== 'config.js')
  }

  if (options.force || checkOverride('other config files', override)) {
    const babel = await _.globSync('./.babelrc', globOptions)
    const eslint = await _.globSync('./.eslintrc.js', globOptions)

    otherConfig = [babel[0], eslint[0]]
  }

  if (options.force || checkOverride('files in demo', override)) {
    demo = await _.globSync('tools/demo/**/*', globOptions)
  }

  if (options.force || checkOverride('files for ignore config', override)) {
    const gitignore = await _.globSync('./.gitignore', globOptions)
    const npmignore = await _.globSync('./.npmignore', globOptions)

    ignore = [gitignore[0], npmignore[0]]
  }

  const allFiles = [].concat(testUtils, otherTools, otherTestTools, otherConfig, demo, ignore)
  for (let i = 0, len = allFiles.length; i < len; i++) {
    const filePath = allFiles[i]
    // eslint-disable-next-line no-await-in-loop
    if (filePath) await _.copyFile(path.join(templateDir, filePath), path.join(dirPath, filePath))
  }
}

/**
 * run update command
 */
async function update(dirPath, options) {
  // await _.removeDir(templateDir)
  // await _.downloadTemplate()

  const override = options.override || []

  if (options.force || checkOverride('package.json', override)) {
    await updatePackageJson(dirPath)
  }

  if (options.force || checkOverride('tools/config.js', override)) {
    await updateConfig(dirPath)
  }

  await copyOthers(dirPath, options)
}

module.exports = function (dirPath, options = {}) {
  update(dirPath, options)
    // eslint-disable-next-line no-console
    .then(() => console.log(`[update done]: ${dirPath}`))
    // eslint-disable-next-line no-console
    .catch(err => console.error(err))
}
