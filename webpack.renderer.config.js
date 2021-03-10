const ElectronBytenodeWebpackPlugin = require("./electron-bytenode-webpack-plugin");

const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  // plugins: [new ElectronBytenodeWebpackPlugin()]
};