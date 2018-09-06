const path = require('path')

process.argv.push('init')
process.argv.push(path.join(__dirname, './demo'))
// process.argv.push('--force') // 强制初始化，就算已存在项目代码
// process.argv.push('--newest') // 先拉取最新脚手架再初始化

process.argv.push('--type')
process.argv.push('plugin')

require('../../src/cli')