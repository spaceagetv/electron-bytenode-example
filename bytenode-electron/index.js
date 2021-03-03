const path = require('path')
const fs = require('fs-extra')
const { format } = require('util')
const { fork } = require('child_process')
const isElectron = require('is-electron')

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

/**
 * Compile files under Electron
 * @param {String | Array} source - single file path or array of file paths
 * @param {String} destination - path of folder or filename, path/to/directory or path/to/file.jsc - if it doesn't end in .jsc, we assume it'd a directory
 * @param {Boolean | String} loader - name of loader file to create, filename.js or *.preload.js or true for *.loader.js
 */
function createElectronBytenode(source, destination, loader) {
  source = typeof source === 'string' ? [source] : source

    // path to bytenode CLI
    // const bytenodeCliPath = path.join('node_modules', 'bytenode', 'cli.js')

    // path to electron CLI
    const electronPath = path.join('node_modules', 'electron', 'cli.js')
    
    const destArgs = destination ? ['--destination', destination] : []

    const loaderArgs = loader ? ['--loader', loader] : []

    const proc = fork(electronPath, [__filename, ...source, ...destArgs, ...loaderArgs], {
      env: {ELECTRON_RUN_AS_NODE: 1}
    })
    // console.log('After fork.')
  
    proc.addListener('message', (message) => console.log(message))
    proc.on('exit', () => console.log('Bytenode finished'))
  
    // console.log(proc.spawnargs, proc.spawnfile)
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
    console.log('index of destination', destIndex)
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

  console.log(args)

  files = args.filter(arg => arg[0] !== '-')
  flags = args.filter(arg => arg[0] === '-')

  console.log('Files: ', files, 'Flags: ', flags)

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
  if (typeof loaderFileName === 'boolean' || loaderFileName === undefined) {
    loaderFileName = fileToLoad.replace('.jsc', '.loader.js')
  }
  loaderFileName.replace('*', path.parse(fileToLoad).name)
  console.log('Creating loader: %s', loaderFileName)
  const relativePath = path.relative(path.dirname(loaderFileName), fileToLoad)
  const template = format(`require('bytenode'); require('./%s')`, relativePath)
  fs.outputFileSync(loaderFileName, template)
}

function createDirectoryIfNeeded (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true})
  }
}

module.exports = { createElectronBytenode }
