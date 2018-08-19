#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const program = require('commander')
const inquirer = require('inquirer')

const config = require('../package.json')
const init = require('./init')
const update = require('./update')

/**
 * start init
 */
function startInit(dirPath, options) {
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
    .then(answers => init(dirPath, answers))
    // eslint-disable-next-line no-console
    .catch(err => console.error(err))
}

/**
 * start update
 */
function startUpdate(dirPath, options) {
  if (options.force) {
    update(dirPath, options)
  } else {
    inquirer
      .prompt([{
        type: 'checkbox',
        name: 'override',
        message: 'which files should be overrided',
        pageSize: 10,
        choices: [
          {name: 'package.json (only override the "scripts", "jest" and "devDependencies")', checked: true},
          {name: 'tools/config.js (only do add or update, will not do remove)', checked: true},
          {name: 'test/utils.js', checked: true},
          {name: 'other tools files (gulpfile.js, tools/build.js, tools/utils.js, tools/checkcomponents.js, tools/test/*.js and so on)', checked: true},
          {name: 'other config files (.babelrc, .eslintrc and so on)', checked: true},
          {name: 'files in demo (tools/demo)'},
          {name: 'files for ignore config (.gitignore, .npmignore)'}
        ]
      }])
      .then(answers => update(dirPath, answers))
      // eslint-disable-next-line no-console
      .catch(err => console.error(err))
  }
}

program
  .version(config.version)

program
  .command('init [dirPath]')
  .description('create a project for miniprogram custom component')
  .option('-f, --force', 'all files will be overrided whether it already exists or not')
  .action((dirPath, options) => {
    dirPath = dirPath || process.cwd()

    if (options.force) {
      startInit(dirPath, options)
    } else {
      try {
        fs.accessSync(path.join(dirPath, './package.json'))
        // eslint-disable-next-line no-console
        console.log(`project already exists: ${dirPath}`)
      } catch (err) {
        startInit(dirPath, options)
      }
    }
  })

program
  .command('update [dirPath]')
  .description('update the miniprogram custom component framwork')
  .option('-f, --force', 'all files will be overrided except src folder and test case files')
  .action((dirPath, options) => {
    dirPath = dirPath || process.cwd()

    try {
      fs.accessSync(path.join(dirPath, './package.json'))
      startUpdate(dirPath, options)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`project does not exist: ${dirPath}`)
    }
  })

program.parse(process.argv)
