const Module = require('module');
const path = require('path');
const v8 = require('v8');

const electronBytenode = require('electron-bytenode');
const WebpackVirtualModules = require('webpack-virtual-modules');

v8.setFlagsFromString('--no-lazy');

// TODO: document things
// TODO: validate against electron-forge's renderer webpack config (depends on multiple entry points support)
// TODO: webpack v5 support

class ElectronBytenodeWebpackPlugin {

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

  apply(compiler) {
    this.setupLifecycleLogging(compiler);

    const { entry, externals, loaderChunks, output, virtualModules } = this.processOptions(compiler.options);

    compiler.options.entry = entry;
    compiler.options.externals = externals;
    compiler.options.output.filename = output.filename;

    if (this.options.preventSourceMaps) {
      compiler.options.devtool = false;
    }

    new WebpackVirtualModules(virtualModules)
      .apply(compiler);

    this.debug('modified options', {
      devtool: compiler.options.devtool,
      entry: compiler.options.entry,
      externals: compiler.options.externals,
      output: compiler.options.output,
    });

    compiler.hooks.emit.tapAsync(this.name, async (compilation, callback) => {
      const loaderFiles = [];

      for (const chunk of compilation.chunks) {
        if (loaderChunks.includes(chunk.id)) {
          loaderFiles.push(...chunk.files);
        }
      }

      const outputExtensionRegex = new RegExp('\\' + output.extension + '$', 'i');
      const shouldCompile = name => {
        return outputExtensionRegex.test(name) && !loaderFiles.includes(name);
      };

      for (const { name, source: asset } of compilation.getAssets()) {
        this.debug('emitting', name);

        if (!shouldCompile(name)) {
          continue;
        }

        let source = asset.source();

        if (this.options.compileAsModule) {
          source = Module.wrap(source);
        }

        const compiledAssetName = name.replace(outputExtensionRegex, '.jsc');
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

  processOptions(options) {
    const externals = this.preprocessExternals(options.externals);
    const output = this.preprocessOutput(options.output);

    const entries = [];
    const loaderChunks = [];
    const virtualModules = [];

    for (const { entry, compiled, loader } of this.preprocessEntry(options.entry)) {
      const entryName = entry.name.toLowerCase() === 'main' && !output.isDynamic
        ? output.name
        : entry.name;

      entries.push([entryName, loader.location]);
      loaderChunks.push(entryName);

      const { name, relativeImportPath } = compiled;

      entries.push([name, entry.location]);
      externals.push(relativeImportPath);
      virtualModules.push([loader.location, createLoaderCode(relativeImportPath)]);
    }

    return {
      entry: Object.fromEntries(entries),
      externals,
      loaderChunks,
      output,
      virtualModules: Object.fromEntries(virtualModules),
    };
  }

  preprocessExternals(externals) {
    if (Array.isArray(externals)) {
      return externals;
    }

    if (typeof externals === 'string') {
      return [externals];
    }

    return [];
  }

  preprocessOutput(output) {
    const { extension, filename, name } = prepare(output.filename);
    const isDynamic = filename.includes('[') || filename.includes(']');

    return {
      extension,
      filename: isDynamic ? filename : '[name]' + extension,
      isDynamic,
      name: isDynamic ? undefined : name,
    };
  }

  preprocessEntry(entries) {
    if (typeof entries === 'string') {
      entries = [[null, entries]];
    } else if (Array.isArray(entries)) {
      entries = entries.map(entry => [null, entry]);
    } else {
      entries = Object.entries(entries);
    }

    return entries.map(([name, location]) => {
      const entry = prepare(location, name);
      const compiled = prepare(location, name, name => `${name}.compiled`);
      const loader = prepare(location, name, name => `${name}.loader`);

      return {
        entry, compiled, loader,
      };
    });
  }

  debug(title, data, ...rest) {
    if (this.options.debugLogs !== true) {
      return;
    }

    if (typeof data === 'object') {
      console.debug('');

      if (typeof title === 'string') {
        title = title.endsWith(':') ? title : `${title}:`;
      }
    }

    this.log(title, data, ...rest);
  }

  log(...messages) {
    console.debug(`[${this.name}]:`, ...messages);
  }

  setupLifecycleLogging(compiler) {
    if (this.options.debugLifecycle !== true) {
      return;
    }

    this.setupHooksLogging('compiler', compiler.hooks);

    compiler.hooks.normalModuleFactory.tap(this.name, normalModuleFactory => {
      this.setupHooksLogging('normalModuleFactory', normalModuleFactory.hooks);

      // this.log({ normalModuleFactory });

      // normalModuleFactory.hooks.module.tap(this.name, (createdModule, result) => {
      //   this.log(createdModule.constructor.name, { createdModule, result });
      // });

      // normalModuleFactory.hooks.afterResolve.tap(this.name, data => {
      //   this.log({ data, loaders: data.loaders });
      // });
    });

    compiler.hooks.compilation.tap(this.name, compilation => {
      this.setupHooksLogging('compilation', compilation.hooks);

      compilation.hooks.addEntry.tap(this.name, (context, entry) => {
        this.log({ context, entry });
      });

      // compilation.hooks.chunkAsset.tap(this.name, (chunk, filename) => {
      //   this.log({ chunk, filename });
      // });

      // compilation.hooks.afterChunks.tap(this.name, chunks => {
      //   this.log({ chunks });
      // });

      // compilation.hooks.buildModule.tap(this.name, module => {
      //   this.log(module.constructor.name, { module });
      // });
    });
  }

  setupHooksLogging(type, hooks) {
    const name = this.name;

    for (const [hookName, hook] of Object.entries(hooks)) {
      try {
        hook.tap(name, function () {
          console.debug(`[${name}]: ${type} hook: ${hookName} (${arguments.length} arguments)`);
        });
      } catch (e) {}
    }
  }
}

function createLoaderCode(relativePath) {
  return `
      require('bytenode');
      require('${relativePath}');
    `;
}

function prepare(location, name, modifier = name => name) {
  const directory = path.dirname(location);
  const extension = path.extname(location);
  const basename = modifier(path.basename(location, extension));
  const filename = basename + extension;
  const relativeImportPath = './' + basename;

  name = name ? modifier(name) : basename;
  location = path.join(directory, filename);


  return {
    basename, directory, extension, filename, location, name, relativeImportPath,
  };
}

module.exports = ElectronBytenodeWebpackPlugin;
