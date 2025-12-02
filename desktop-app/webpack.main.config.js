const path = require('path');
const rules = require('./webpack.rules');

module.exports = {
  mode: 'development',
  target: 'electron-main',
  entry: path.resolve(__dirname, 'src/main/index.js'),
  module: { rules },
  resolve: { extensions: ['.js', '.jsx'] },
};
