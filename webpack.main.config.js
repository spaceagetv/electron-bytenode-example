const { BytenodeWebpackPlugin } = require("@dopry/bytenode-webpack-plugin");
const rules = require("./webpack.rules");

/** @type {import(‘@types/webpack’).Configuration} */
module.exports = {
  entry: "./src/main.ts",
  output: {
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  module: {
    rules,
  },
  plugins: [new BytenodeWebpackPlugin({ compileForElectron: true })],
};
