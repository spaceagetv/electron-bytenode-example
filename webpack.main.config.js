const ElectronBytenodeWebpackPlugin = require('./electron-bytenode-webpack-plugin');

/** @type {import(‘@types/webpack’).Configuration} */
module.exports = {
  entry: './src/main.js',
  module: {
    rules: require('./webpack.rules')
  },
  plugins: [
    new ElectronBytenodeWebpackPlugin(),
  ],
}
