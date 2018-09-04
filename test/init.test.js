const path = require('path')

process.argv.push('init')
process.argv.push(path.join(__dirname, './demo'))
process.argv.push('--force')
process.argv.push('--newest')

require('../index')