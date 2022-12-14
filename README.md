# electron-bytenode-example

Example code using [Bytenode](https://github.com/OsamaAbbas/bytenode) + [Bytenode Webpack Plugin](https://github.com/herberttn/bytenode-webpack-plugin) to compile both the render and main processes in an Electron app.

At the command line:

```bash
git clone https://github.com/spaceagetv/electron-bytenode-example.git
cd electron-bytenode-example
npm install
npm start
```

This example uses Herbert Treis Neto's [Bytenode Webpack Plugin](https://github.com/herberttn/bytenode-webpack-plugin) along with Webpack 5 (via [Electron Forge](https://www.electronforge.io)) to bundle and package the application.

Electron gets pointed at small "loader" files which use Bytenode in order to load the binary `.jsc` files containing the original application code (compiled for the V8 engine).

**NOTES!**

1. You must enable `nodeIntegration` in your BrowserWindow `webPreferences` for Bytenode to work in the rendering process. Alternately, you could put your renderer's Javascript code into a preload script, where Node will be available automatically. This is more secure and generally better practice. (Hint: Use `window.addEventListener('DOMContentLoaded', init)` to wait for the DOM to be available to your preload script.)

### Links & Related

- [Bytenode](https://github.com/OsamaAbbas/bytenode)
- [Bytenode Webpack Plugin](https://github.com/herberttn/bytenode-webpack-plugin)
- [Creating Javascript Binaries For Electron](https://www.jjeff.com/blog/2021/4/27/creating-javascript-binaries-for-electron)
- [Electron React Bytenode Quickstart](https://github.com/MetaiR/electronforge_react_bytenode_quickstart)
