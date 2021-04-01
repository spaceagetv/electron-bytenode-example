const { BytenodeWebpackPlugin } = require('@herberttn/bytenode-webpack-plugin')
const rules = require('./webpack.rules');

/** @type {import(‘@types/webpack’).Configuration} */
module.exports = {
  output: { devtoolModuleFilenameTemplate: '[absolute-resource-path]' },
  module:{
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [ 
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          }
        ],
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                strictMath: true,
              },
            },
          },
        ],
      }
    ],

  },

  plugins: [
    new BytenodeWebpackPlugin({ compileForElectron: true }),
  ],
};