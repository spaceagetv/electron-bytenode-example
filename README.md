# electron-bytenode-example

Example code using [Bytenode](https://github.com/OsamaAbbas/bytenode) + [Bytenode Webpack Plugin](https://github.com/herberttn/bytenode-webpack-plugin) to compile both the render and main processes in an Electron app.

At the command line:

```bash
git clone https://github.com/spaceagetv/electron-bytenode-example.git
cd electron-bytenode-example
npm install
npm start
```

This example uses Herbert Treis Neto's [Bytenode Webpack Plugin](https://github.com/herberttn/bytenode-webpack-plugin) along with Webpack and [Electron Forge](https://www.electronforge.io) to bundle and package the application.

Electron gets pointed at small "loader" files which bundle Bytenode in order to load the binary `.jsc` files containing the original application code.

NOTE! You must enable `nodeIntegration` in your BrowserWindow `webPreferences` for Bytenode to work in the rendering process. Alternately, you could include your rendering code using a preload script, where Node will be available automatically.
