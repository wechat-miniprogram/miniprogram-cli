#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const program = require('commander')
const inquirer = require('inquirer')

const packageConfig = require('../package.json')
const _ = require('./utils')
const initCustomComponent = require('./custom-component/init')
const upgradeCustomComponent = require('./custom-component/upgrade')
const initQuickstart = require('./quickstart/init')

/**
 * 开始初始化自定义组件
 */
function startInitCustomComponent(dirPath, options) {
  const defualtName = path.basename(dirPath)

  inquirer
    .prompt([{
      type: 'input',
      name: 'name',
      message: 'please input the package name',
      default: defualtName,
    }, {
      type: 'input',
      name: 'version',
      message: 'please input the package version',
      default: '1.0.0',
      validate(input) {
        return input.match(/^\d+\.\d+\.\d+$/) ? true : 'the version must be in <number>.<number>.<number> format'
      },
    }, {
      type: 'input',
      name: 'dist',
      message: 'please input the miniprogram dist folder',
      default: 'miniprogram_dist',
    }, {
      type: 'input',
      name: 'git',
      message: 'please input the git repository url',
    }, {
      type: 'input',
      name: 'author',
      message: 'please input the author',
    }])
    .then(answers => initCustomComponent(dirPath, Object.assign(options, answers)))
    // eslint-disable-next-line no-console
    .catch(err => console.error(err))
}

/**
 * 开始升级自定义组件
 */
function startUpgradeCustomComponent(dirPath, options) {
  if (options.force) {
    upgradeCustomComponent(dirPath, options)
  } else {
    inquirer
      .prompt([{
        type: 'checkbox',
        name: 'override',
        message: 'which files should be overrided',
        pageSize: 10,
        choices: [
          {name: 'package.json (only override "scripts", "jest" and "devDependencies")', checked: true},
          {name: 'tools/config.js', checked: true},
          {name: 'test/utils.js', checked: true},
          {name: 'other tools files (gulpfile.js, tools/build.js, tools/utils.js, tools/checkcomponents.js, tools/test/*.js)', checked: true},
          {name: 'other config files (.babelrc, .eslintrc)', checked: true},
          {name: 'tools/demo'},
          {name: 'ignore config (.gitignore, .npmignore)'}
        ]
      }])
      .then(answers => upgradeCustomComponent(dirPath, Object.assign(options, answers)))
      // eslint-disable-next-line no-console
      .catch(err => console.error(err))
  }
}

/**
 * 开始初始化
 */
function startInit(dirPath, options) {
  if (options.type === 'custom-component') {
    // 自定义组件
    if (options.force) {
      startInitCustomComponent(dirPath, options)
    } else {
      try {
        fs.accessSync(path.join(dirPath, './package.json'))
        // eslint-disable-next-line no-console
        console.log(`project already exists: ${dirPath}`)
      } catch (err) {
        startInitCustomComponent(dirPath, options)
      }
    }
  } else {
    // 其他 quickstart
    if (options.force) {
      initQuickstart(dirPath, options)
    } else {
      try {
        fs.accessSync(path.join(dirPath, './project.config.json'))
        // eslint-disable-next-line no-console
        console.log(`project already exists: ${dirPath}`)
      } catch (err) {
        initQuickstart(dirPath, options)
      }
    }
  }
}

/**
 * 开始升级
 */
function startUpgrade(dirPath, options) {
  try {
    fs.accessSync(path.join(dirPath, './package.json'))
    startUpgradeCustomComponent(dirPath, options)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`project is not a valid custom component project: ${dirPath}`)
  }
}

program
  .version(packageConfig.version)

/**
 * 初始化相关
 */
program
  .command('init [dirPath]')
  .description('create a project with template project')
  .option('-t, --type <type>', 'template project type, only accept "custom-component", "miniprogram", "node", "php", "plugin", "game"')
  .option('-f, --force', 'all files will be overrided whether it already exists or not')
  .option('-p, --proxy <url>', 'http/https request proxy')
  .option('-n, --newest', 'use newest template to initialize project')
  .action((dirPath, options) => {
    dirPath = dirPath || process.cwd()

    const choices = ['custom-component', 'miniprogram', 'node', 'php', 'plugin', 'game']

    if (!options.type || choices.indexOf(options.type) < 0) {
      // 未指定类型，则发起询问
      inquirer
        .prompt([{
          type: 'list',
          name: 'type',
          message: 'which type of project want to use to initialize',
          default: 'custom-component',
          choices: ['custom-component', 'miniprogram', 'node', 'php', 'plugin', 'game'],
        }])
        .then(answers => startInit(dirPath, Object.assign(options, answers)))
        // eslint-disable-next-line no-console
        .catch(err => console.error(err))
    } else {
      // 已指定类型
      startInit(dirPath, options)
    }
  })

/**
 * 升级相关
 */
program
  .command('upgrade [dirPath]')
  .description('upgrade the miniprogram custom component framwork')
  .option('-f, --force', 'all files will be overrided except src folder and test case files')
  .option('-p, --proxy <url>', 'http/https request proxy')
  .action((dirPath, options) => {
    dirPath = dirPath || process.cwd()

    try {
      fs.accessSync(path.join(dirPath, './project.config.json'))

      inquirer
        .prompt([{
          type: 'confirm',
          name: 'force',
          message: 'this project doesn\'t look like a custom component project, is it stop upgrading?',
          default: true,
        }])
        .then(answers => {
          if (!answers.force) {
            // 猜测为非自定义组件项目，仍旧强制升级
            startUpgrade(dirPath, options)
          }
        })
        // eslint-disable-next-line no-console
        .catch(err => console.error(err))
    } catch (err) {
      // ignore
      startUpgrade(dirPath, options)
    }
  })

/**
 * 缓存相关
 */
program
  .command('cache')
  .description('show the path of template projects cache')
  .option('-c, --clear', 'clear cache')
  .action(options => {
    const templateDir = _.getTemplateDir()

    if (options.clear) {
      _.removeDir(templateDir)
        // eslint-disable-next-line no-console
        .then(() => console.log(`[remove cache done]: ${templateDir}`))
        // eslint-disable-next-line no-console
        .catch(err => console.error(err))
    } else {
      // eslint-disable-next-line no-console
      console.log(templateDir)
    }
  })

program.parse(process.argv)
