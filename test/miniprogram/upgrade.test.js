const path = require('path')

process.argv.push('upgrade')
process.argv.push(path.join(__dirname, './demo'))
// process.argv.push('--force') // 强制更新脚手架

require('../../src/cli')
