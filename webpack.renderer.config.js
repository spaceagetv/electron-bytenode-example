const { BytenodeWebpackPlugin } = require('@herberttn/bytenode-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const rules = require('./webpack.rules');

/** @type {import(‘@types/webpack’).Configuration} */
module.exports = {
  output: { devtoolModuleFilenameTemplate: '[absolute-resource-path]' },
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          // {
          //   loader: 'style-loader', // re-enable this if disabling MiniCssExtractPlugin
          // },
          {
            loader: 'css-loader',
          }
        ],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin(),
    new BytenodeWebpackPlugin({ compileForElectron: true }),
  ],
};
