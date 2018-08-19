const path = require('path')

process.argv.push('update')
process.argv.push(path.join(__dirname, './demo'))
// process.argv.push('--force')

require('../index')