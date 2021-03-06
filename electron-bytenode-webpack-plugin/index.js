const Module = require('module')
// const bytenode = require('bytenode')
const eBytenode = require('electron-bytenode')

require('v8').setFlagsFromString('--no-lazy')


require('webpack').LoaderOptionsPlugin

/*
Things I need to do:

1. Compile js code to .jsc code. A la the webpack-bytecode module.
2. Add loader files (where the old js files used to be)
3. Run the loader files through webpack.

Hooks, I'll probably want to use:


*/

/**
 * @type {LoaderOptionsPlugin}
 */
module.exports = class ElectronBytenodeWebpackPlugin {
  constructor (options = {}) {
    this.name = 'ElectronBytenodeWebpackPlugin'
    this.options = Object.assign({
      compileAsModule: true,
      keepSource: false
    }, options)
  }

  apply (compiler) {
    // Before emitting compiled files
    compiler.hooks.emit.tap(this.name, compilation => {
      // For all .js files
      for (const filename in compilation.assets) {
        if (/\.js$/.test(filename)) {
          // Compile them to v8 bytecode and emit them as .jsc files
          let source = compilation.assets[filename].source()
          if (this.options.compileAsModule) {
            source = Module.wrap(source)
          }
          eBytenode.createElectronBytenode()
          const bytecode = eBytenode.compileCode(source)
          compilation.assets[filename.replace('.js', '.jsc')] = {
            source: () => bytecode,
            size: () => bytecode.length
          }
          if (!this.options.keepSource) {
            delete compilation.assets[filename]
          }
        }
      }
    })
  }
 }