const Module = require('module')
// const { Plugin } = require('webpack')
// const bytenode = require('bytenode')
const electronBytenode = require('electron-bytenode')
const fs = require('fs')
const path = require('path')
const util = require('util')

require('v8').setFlagsFromString('--no-lazy')

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

  /** @param {Compiler} compiler */
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
      // console.log(util.inspect(compilation, true, 7, true))
      // callback()
    })

    // Before emitting compiled files
    compiler.hooks.emit.tapAsync(this.name, async (compilation, callback) => {
      fs.writeFileSync('compilation.txt', util.inspect(compilation, true, 7))
      // For all .js files
      for (const filename in compilation.assets) {
        if (/\.js$/.test(filename)) {
          // Compile them to v8 bytecode and emit them as .jsc files
          let source = compilation.assets[filename].source()
          if (this.options.compileAsModule) {
            source = Module.wrap(source)
          }
          // const bytecode = await bytenode.compileElectronCode(source)
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

            // We add the loader code to the compilation.assets here
            // but the 'emit' hook is too late in the cycle
            // so this code doesn't get aggregated/bundled and bytenode
            // is not found
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
