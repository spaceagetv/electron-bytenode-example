const Module = require('module');
const fs = require('fs');
const path = require('path');
const v8 = require('v8');

const WatchIgnorePlugin = require('webpack/lib/WatchIgnorePlugin');
const electronBytenode = require('electron-bytenode');

v8.setFlagsFromString('--no-lazy');

const COMPILED_EXTENSION = '.jsc';

// TODO: document things
// TODO: multiple entry points support
// TODO: validate against electron-forge's renderer webpack config (depends on multiple entry points support)
// TODO: webpack v5 support

module.exports = class ElectronBytenodeWebpackPlugin {

  constructor(options = {}) {
    this.name = 'ElectronBytenodeWebpackPlugin';
    this.options = {
      compileAsModule: true,
      debugLifecycle: false,
      debugLogs: false,
      keepSource: false,
      preventSourceMaps: true,
      ...options,
    };
  }

  // entry: {
  //   index: './src/loader.js',
  //   main: './src/main.js'
  // },
  // output: {
  //   filename: '[name].js'
  // },
  // externals: './main',

  // src
  // - main.js
  //
  // out
  // - main.jsc
  // - index.js > ./main.jsc

  // entries
  // - main.js
  // - main-loader.js > ./main.js
  // externals
  // - ./main.js

  apply(compiler) {
    this.setupLifecycleLogging(compiler);

    const entry = compiler.options.entry;
    const output = compiler.options.output.filename;
    this.debug('options', { entry, output });

    this.checkOptions(entry, output);

    const entryDirectory = path.dirname(entry);
    const entryExtension = path.extname(entry);
    const entryName = path.basename(entry, entryExtension);
    this.debug('entry', { entryDirectory, entryExtension, entryName });

    const entryLoaderName = `${entryName}.loader`;
    const entryLoader = path.join(entryDirectory, entryLoaderName + entryExtension);
    this.debug('loader', { entryLoaderName, entryLoader });

    const outputExtension = path.extname(output);
    const outputExtensionRegex = new RegExp('\\' + outputExtension + '$', 'i');
    const outputName = path.basename(output, outputExtension);
    this.debug('output', { outputExtension, outputExtensionRegex, outputName });

    const compiledName = `${outputName}.compiled`;
    const compiledImportPath = `./${compiledName}`;
    this.debug('compiled', { compiledName, compiledImportPath });

    this.createLoader(entryLoader, compiledImportPath);

    new WatchIgnorePlugin([entryLoader])
      .apply(compiler);

    compiler.hooks.done.tap(this.name, () => {
      fs.unlinkSync(entryLoader);
    })

    compiler.options.entry = {
      [compiledName]: entry,
      [outputName]: entryLoader,
    };

    compiler.options.output.filename = '[name]' + outputExtension;

    let externals = compiler.options.externals;

    if (externals) {
      externals = Array.isArray(externals) ? externals : [externals];
      externals.push(compiledImportPath);
    } else {
      externals = compiledImportPath;
    }

    compiler.options.externals = externals;

    if (this.options.preventSourceMaps) {
      compiler.options.devtool = false;
    }

    this.debug('modified options', {
      devtool: compiler.options.devtool,
      entry: compiler.options.entry,
      externals: compiler.options.externals,
      output: compiler.options.output,
    });

    const shouldCompile = name => {
      return outputExtensionRegex.test(name) && name !== output;
    };

    compiler.hooks.emit.tapAsync(this.name, async (compilation, callback) => {
      for (const { name, source: asset } of compilation.getAssets()) {
        this.debug('emitting', name);

        if (!shouldCompile(name)) {
          continue;
        }

        let source = asset.source();

        if (this.options.compileAsModule) {
          source = Module.wrap(source);
        }

        const compiledAssetName = name.replace(outputExtensionRegex, COMPILED_EXTENSION);
        this.debug('compiling to', compiledAssetName);

        const compiledAssetSource = await electronBytenode.compileCode(source);

        compilation.assets[compiledAssetName] = {
          size: () => compiledAssetSource.length,
          source: () => compiledAssetSource,
        }

        if (!this.options.keepSource) {
          delete compilation.assets[name];
        }
      }

      callback();
    })
  }

  /**
   * @param {string} title
   * @param {Object} data
   */
  debug(title, data) {
    if (this.options.debugLogs !== true) {
      return;
    }

    title = title.endsWith(':') ? title : `${title}:`;

    if (typeof data === 'object') {
      console.debug('');
    }
    console.debug(title, data);
  }

  createLoader(loaderPath, relativePathToLoad) {
    const code = this.createLoaderCode(relativePathToLoad);
    fs.writeFileSync(loaderPath, code, { encoding: 'utf-8' });
  }

  createLoaderCode(relativePath) {
    return `
      require('bytenode');
      require('${relativePath}');
    `;
  }

  checkOptions(entry, output) {
    if (typeof entry !== 'string') {
      this.throwOptionError('entry', 'should be a string', 'Multiple entries are not supported right now');
    }

    if (typeof output !== 'string') {
      this.throwOptionError('output.filename', 'should be a string');
    }

    if (output.includes('[') || output.includes(']')) {
      this.throwOptionError('output.filename', 'should not be dynamic', 'Multiple entries are not supported right now');
    }
  }

  throwOptionError(option, message, details) {
    const error = `[${this.name}]: Option "${option}" ${message}.`;

    if (details) {
      throw new Error(`${error} Details: ${details}.`);
    }

    throw new Error(error);
  }

  setupLifecycleLogging(compiler) {
    if (this.options.debugLifecycle !== true) {
      return;
    }

    for (const [name, hook] of Object.entries(compiler.hooks)) {
      hook.tap(this.name, function () {
        console.log('compiler hook:', name, `(${arguments.length} arguments)`);
      });
    }

    compiler.hooks.normalModuleFactory.tap(this.name, normalModuleFactory => {
      // console.log({ normalModuleFactory });

      for (const [name, hook] of Object.entries(normalModuleFactory.hooks)) {
        try {
          hook.tap(this.name, function () {
            console.log('normalModuleFactory hook:', name, `(${arguments.length} arguments)`);
          });
        } catch (e) {}
      }

      // normalModuleFactory.hooks.module.tap(this.name, function (createdModule, result) {
      //   console.log('normalModuleFactory hook:', 'module', { createdModule, result });
      // });

      // normalModuleFactory.hooks.afterResolve.tap(this.name, function (data, callback) {
      //   console.log('normalModuleFactory hook:', 'afterResolve', { data, callback, loaders: data.loaders });
      // });
    });

    compiler.hooks.thisCompilation.tap(this.name, compilation => {
      for (const [name, hook] of Object.entries(compilation.hooks)) {
        hook.tap(this.name, function () {
          console.log('compilation hook:', name, `(${arguments.length} arguments)`);
        });
      }

      // compilation.hooks.addEntry.tap(this.name, (context, entry) => {
      //   console.log({ context, entry });
      // });

      // compilation.hooks.chunkAsset.tap(this.name, (chunk, filename) => {
      //   console.log({ chunk, filename });
      // });

      // compilation.hooks.afterChunks.tap(this.name, chunks => {
      //   console.log({ chunks });
      // });

      // compilation.hooks.buildModule.tap(this.name, module => {
      //   console.log(module.constructor.name, { module });
      // });
    });
  }
}
