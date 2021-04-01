const rules = require('./webpack.rules');
const { BytenodeWebpackPlugin } = require('@herberttn/bytenode-webpack-plugin')

/** @type {import(‘@types/webpack’).Configuration} */
module.exports = {
  entry: './src/main.js',
  module: {
    rules,
  },
  plugins: [
    new BytenodeWebpackPlugin({ compileForElectron: true }),
  ],
}
