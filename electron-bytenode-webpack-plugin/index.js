const Module = require('module')
// const { Plugin } = require('webpack')
// const bytenode = require('bytenode')
const electronBytenode = require('electron-bytenode')
const fs = require('fs')
const path = require('path')
const util = require('util')

require('v8').setFlagsFromString('--no-lazy')

/*
Things I need to do:

1. Compile js code to .jsc code. A la the webpack-bytecode module.
2. Add loader files (where the old js files used to be)
3. Run the loader files through webpack.

Hooks, I'll probably want to use:

*/

/**
 * @type {Plugin}
 */
module.exports = class ElectronBytenodeWebpackPlugin {
  constructor(options = {}) {
    this.name = 'ElectronBytenodeWebpackPlugin'
    this.options = Object.assign({
      compileAsModule: true,
      keepSource: false,
      replaceWithLoader: true
    }, options)
  }

  apply(compiler) {
    // Before compiling
    compiler.hooks.afterResolvers.tap(this.name, async (compiler) => {
      // console.log('%s afterResolvers', this.name, compiler)
      // fs.writeFileSync('compilation.txt', util.inspect(compilation, 7))
      // // For all .js files
      // for (const filename in compilation.assets) {

      // }
    })

    // Before emitting compiled files
    compiler.hooks.emit.tapAsync(this.name, async (compilation, callback) => {
      fs.writeFileSync('compilation.txt', util.inspect(compilation, true, 4))
      // For all .js files
      for (const filename in compilation.assets) {
        if (/\.js$/.test(filename)) {
          // Compile them to v8 bytecode and emit them as .jsc files
          const source = compilation.assets[filename].source()
          // if (this.options.compileAsModule) {
          //   source = Module.wrap(source)
          // }
          const bytecode = await electronBytenode.compileCode(source)
          compilation.assets[filename.replace('.js', '.jsc')] = {
            source: () => bytecode,
            size: () => bytecode.length
          }
          if (!this.options.keepSource) {
            delete compilation.assets[filename]
          }
          if (this.options.replaceWithLoader) {
            // console.log('Adding Bytnode loader for %s', filename)
            const relativePath = path.parse(filename).base.replace('.js', '.jsc')
            const loader = electronBytenode.loaderCode(relativePath)
            compilation.assets[filename] = {
              source: () => loader,
              size: () => loader.length
            }
          }
        }
      }
      callback()
    })
  }
}
