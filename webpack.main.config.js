const ElectronBytenodeWebpackPlugin = require("./electron-bytenode-webpack-plugin");

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/main.js",
  // Put your normal webpack config below here
  // externals: { bytenode: 'bytenode' },
  module: {
    rules: require("./webpack.rules")
  },
  plugins: [new ElectronBytenodeWebpackPlugin()]
}
