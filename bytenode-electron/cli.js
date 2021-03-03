const path = require('path')
const fs = require('fs-extra')
const { format } = require('util')
const isElectron = require('is-electron')

const { createElectronBytenode } = require('./index.js')

// only used in subprocess
const bytenode = require('bytenode')

// console.log(process.argv)

const args = process.argv

// only leave arguments after this script
while (args.includes(__filename) || args.includes(__dirname)) {
  args.shift()
}

if (!isElectron()) {
  // not running Electron yet
  createElectronBytenode(args)

} else {
  // now we're running Electron!
  createFiles(args)  
}

function createFiles(args) {
  let destination
  let loader = false
  if (args.includes('-d')) {
    args[args.indexOf('-d')] = '--destination'
  }
  if (args.includes('-l')) {
    args[args.indexOf('-l')] = '--loader'
  }
  if (args.includes('--destination')) {
    const destIndex = args.indexOf('--destination')
    destination = args[destIndex + 1]
    if (!destination || destination[0] === '-') {
      console.error('--destination set without path argument')
      return
    }
    args.splice(destIndex, 2)
  }
  if (args.includes('--loader')) {
    const loaderIndex = args.indexOf('--loader')
    loader = args[loaderIndex + 1]
    if (loader && loader[0] === '-') loader = null
    args.splice(loaderIndex, loader ? 2 : 1)
    loader = loader || true
  }

  files = args.filter(arg => arg[0] !== '-')
  flags = args.filter(arg => arg[0] === '-')

  files.forEach((file) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`${file} can't be found`)
        return
      }
      const jscFileName = path.parse(file).name + '.jsc'
      const outputFile = destination.endsWith('.jsc') ? destination : path.join(destination, jscFileName)
      createDirectoryIfNeeded(path.dirname(outputFile))
      const options = {
        filename: file, 
        output: outputFile,
        compileAsModule: true
      }
      const jscFile = bytenode.compileFile(options)
      console.log('Created bytenode file: %s', jscFile)
      if (loader !== false) {
        addLoader(outputFile, loader)
      }
    } catch (err) {
      console.error(err)
    }
  })
}

/**
 * Add a loader file for a given .jsc file
 * @param {String} fileToLoad relative path of the .jsc file we're loading
 * @param {String} loaderFileName - optional name of the file to write
 */
function addLoader(fileToLoad, loaderFileName) {
  console.log('addLoader()::', fileToLoad, loaderFileName)
  let loaderFilePath
  if (typeof loaderFileName === 'boolean' || loaderFileName === undefined) {
    loaderFilePath = fileToLoad.replace('.jsc', '.loader.js')
  } else {
    loaderFileName = loaderFileName.replace('%', path.parse(fileToLoad).name)
    loaderFilePath = path.join(path.dirname(fileToLoad), loaderFileName)
  }
  const relativePath = path.relative(path.dirname(loaderFilePath), fileToLoad)
  const template = format(`require('bytenode'); require('./%s')`, relativePath)
  fs.outputFileSync(loaderFileName, template)
  console.log('Created loader: %s', loaderFileName)
}

function createDirectoryIfNeeded (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true})
  }
}
