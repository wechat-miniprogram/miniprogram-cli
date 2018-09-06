const fs = require('fs')
const path = require('path')
const os = require('os')

const glob = require('glob')
const download = require('download')
const rimraf = require('rimraf')
const ProgressBar = require('progress')

const templateDir = path.join(os.tmpdir(), './miniprogram_cli_template')

/**
 * 异步函数封装
 */
function wrap(func, scope) {
  return function (...args) {
    if (args.length) {
      const temp = args.pop()
      if (typeof temp !== 'function') {
        args.push(temp)
      }
    }

    return new Promise(function (resolve, reject) {
      args.push(function (err, data) {
        if (err) reject(err)
        else resolve(data)
      })

      func.apply((scope || null), args)
    })
  }
}
const accessSync = wrap(fs.access)
const statSync = wrap(fs.stat)
const renameSync = wrap(fs.rename)
const mkdirSync = wrap(fs.mkdir)
const readFileSync = wrap(fs.readFile)
const writeFileSync = wrap(fs.writeFile)
const globSync = wrap(glob)

/**
 * 获取模板所在目录
 */
function getTemplateDir() {
  return templateDir
}

/**
 * 递归创建目录
 */
async function recursiveMkdir(dirPath) {
  const prevDirPath = path.dirname(dirPath)
  try {
    await accessSync(prevDirPath)
  } catch (err) {
    // prevDirPath is not exist
    await recursiveMkdir(prevDirPath)
  }

  try {
    await accessSync(dirPath)

    const stat = await statSync(dirPath)
    if (stat && !stat.isDirectory()) {
      // dirPath already exists but is not a directory
      await renameSync(dirPath, `${dirPath}.bak`) // rename to a file with the suffix ending in '.bak'
      await mkdirSync(dirPath)
    }
  } catch (err) {
    // dirPath is not exist
    await mkdirSync(dirPath)
  }
}

/**
 * 拷贝文件
 */
async function copyFile(srcPath, distPath) {
  await recursiveMkdir(path.dirname(distPath))

  return new Promise((resolve, reject) => {
    fs.createReadStream(srcPath).pipe(fs.createWriteStream(distPath))
      .on('finish', () => resolve())
      .on('error', err => reject(err))
  })
}

/**
 * 读取文件
 */
async function readFile(filePath) {
  try {
    return await readFileSync(filePath, 'utf8')
  } catch (err) {
    // eslint-disable-next-line no-console
    return console.error(err)
  }
}

/**
 * 写文件
 */
async function writeFile(filePath, data) {
  try {
    await recursiveMkdir(path.dirname(filePath))
    return await writeFileSync(filePath, data, 'utf8')
  } catch (err) {
    // eslint-disable-next-line no-console
    return console.error(err)
  }
}

/**
 * 检查目录是否存在
 */
async function checkDirExist(dirPath) {
  try {
    await accessSync(dirPath)
    return true
  } catch (err) {
    // ignore
  }

  return false
}

/**
 * 删除目录
 */
async function removeDir(dirPath) {
  let isExist = await checkDirExist(dirPath)

  return new Promise((resolve, reject) => {
    if (!isExist) {
      resolve()
    } else {
      rimraf(dirPath, err => {
        if (err) reject(err)
        else resolve()
      })
    }
  })
}

/**
 * 下载模板项目
 */
async function downloadTemplate(config, proxy) {
  const templateProject = path.join(templateDir, config.name)
  let hasDownload = await checkDirExist(templateProject)
  let timer

  if (!hasDownload) {
    // mock download progress
    let total = 20
    const msg = 'now downloading template project'
    const bar = new ProgressBar(':bar :token1', {
      total, incomplete: '░', complete: '█', clear: true
    })
    const tick = () => setTimeout(() => {
      total--
      bar.tick({token1: msg})

      if (total !== 1 && !bar.complete) tick()
    }, 500)
    const stop = () => {
      while (!bar.complete) bar.tick({token1: msg})
    }

    try {
      timer = setTimeout(() => {
        // 超过一分钟没下载完，直接退出进程
        if (!bar.complete) {
          stop()
          // eslint-disable-next-line no-console
          console.log('download faild!')
          process.exit(1)
        }
      }, 60 * 1000)

      tick() // 开始

      await download(config.download, templateProject, {
        extract: true,
        strip: 1,
        mode: '666',
        headers: {accept: 'application/zip'},
        proxy,
      })

      stop() // 结束
    } catch (err) {
      stop()
      // eslint-disable-next-line no-console
      console.error(err)
    }

    if (timer) timer = clearTimeout(timer)
  }
}

module.exports = {
  recursiveMkdir,
  globSync,
  copyFile,
  readFile,
  writeFile,
  removeDir,
  getTemplateDir,
  checkDirExist,
  downloadTemplate,
}
