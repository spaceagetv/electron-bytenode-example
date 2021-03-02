const path = require('path')
const { loadBytecode } = require(path.join(__dirname, 'bytecode_loader'))

loadBytecode('renderer.js')