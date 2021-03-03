const path = require('path')
const { fork } = require('child_process')

/**
 * Compile files under Electron
 * @param {String | Array} source - single file path or array of file paths
 * @param {String} destination - path of folder or filename, path/to/directory or path/to/file.jsc - if it doesn't end in .jsc, we assume it'd a directory
 * @param {Boolean | String} loader - name of loader file to create, filename.js or %.preload.js or true for %.loader.js
 */
function createElectronBytenode(source, destination, loader) {
  source = typeof source === 'string' ? [source] : source
  // path to electron CLI
  const electronPath = path.join('node_modules', 'electron', 'cli.js')
  
  const destArgs = destination ? ['--destination', destination] : []

  const loaderArgs = loader ? ['--loader', loader] : []

  // I wish this happened syncronously
  const proc = fork(electronPath, [path.join(__dirname, 'cli.js'), ...source, ...destArgs, ...loaderArgs], {
    env: {ELECTRON_RUN_AS_NODE: 1}
  })

  proc.addListener('message', (message) => console.log(message))
  proc.on('exit', () => console.log('Bytenode finished'))
}

module.exports = { createElectronBytenode }
