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

1. (What hook?) Add a loader file to the webpack object so that it can get compiled and 'bytenode' can be added to the package.
2.? Make sure that webpack is cool with the .jsc file import for an unresolvable file
3. (Emit) Compile original .js code to .jsc code. A la the webpack-bytecode module.
4. |-- Add the .jsc file to the webpack object

Hooks, I'll probably want to use:
- beforeCompile? 
*/

/** @type {import('@types/webpack').Plugin} */
module.exports = class ElectronBytenodePlugin {
  constructor(options = {}) {
    this.name = 'ElectronBytenodePlugin'
    this.options = Object.assign({
      compileAsModule: true,
      keepSource: false,
      replaceWithLoader: true,
      exclude: []
    }, options)
  }

  apply(compiler) {
    // Before compiling
    compiler.hooks.afterResolvers.tap(this.name, async (compiler) => {
      // console.log('%s afterResolvers', this.name, compiler)
      // fs.writeFileSync('compilation.txt', util.inspect(compilation, 7))
      // // For all .js files
      // debugger
      // for (const filename in compilation.assets) {

      // }
    })

    // compiler.hooks.beforeCompile.tapAsync(this.name, (params, callback) => {
    //   console.log(util.inspect(params, true, 4, true))
    //   callback()
    // })

    compiler.hooks.compilation.tap(this.name, (compilation, compilationParams) => {
      console.log(util.inspect(compilation, true, 7, true))
      // callback()
    })

    // Before emitting compiled files
    compiler.hooks.emit.tapAsync(this.name, async (compilation, callback) => {
      fs.writeFileSync('compilation.txt', util.inspect(compilation, true, 7))
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
