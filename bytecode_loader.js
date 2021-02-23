'use strict';

const bytenode = require('bytenode');
const fs = require('fs');
const v8 = require('v8');
const path = require('path')

v8.setFlagsFromString('--no-lazy');

const SOURCE_DIR = 'src'
const DESTINATION_DIR = 'bytecode'

function createDirectoryIfNeeded (name) {
  name = name || DESTINATION_DIR
  const dir = path.join(__dirname, name)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function loadBytecode(filename) {
  createDirectoryIfNeeded()
  const sourceFile = path.join(__dirname, SOURCE_DIR, filename)
  const newFileName = path.parse(sourceFile).name + '.jsc'
  const bytecodeFile = path.join(__dirname, DESTINATION_DIR, newFileName)
  if (!fs.existsSync(bytecodeFile) || (fs.existsSync(sourceFile) && fs.statSync(bytecodeFile).mtimeMs < fs.statSync(sourceFile).mtimeMs)) {
    console.log(`Compiling ${newFileName}`)
    bytenode.compileFile(sourceFile, bytecodeFile)
  }
  require(bytecodeFile)
}

module.exports = { loadBytecode }
