const path = require('path');
const { WebpackPlugin } = require('@electron-forge/plugin-webpack');

module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [],
  plugins: [
    new WebpackPlugin({
      mainConfig: path.resolve(__dirname, 'webpack.main.config.js'),
      renderer: {
        config: path.resolve(__dirname, 'webpack.renderer.config.js'),
        entryPoints: [
          {
            html: path.resolve(__dirname, 'src/index.html'),
            js: path.resolve(__dirname, 'src/renderer/app.jsx'),
            name: 'main_window',
            preload: {
              js: path.resolve(__dirname, 'src/preload/index.js'),
            },
          },
        ],
      },
    }),
  ],
};
