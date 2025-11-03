const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const rules = require('./webpack.rules');

module.exports = {
  mode: 'development',
  target: 'web',
  entry: path.resolve(__dirname, 'src/renderer/app.jsx'),
  module: { rules },
  resolve: { extensions: ['.js', '.jsx'] },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
    }),
  ],
  devtool: 'inline-source-map',
};
