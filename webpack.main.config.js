const ElectronBytenodeWebpackPlugin = require('./electron-bytenode-webpack-plugin');
const rules = require('./webpack.rules');

/** @type {import(‘@types/webpack’).Configuration} */
module.exports = {
  entry: './src/main.js',
  module: {
    rules,
  },
  plugins: [
    new ElectronBytenodeWebpackPlugin(),
  ],
}
