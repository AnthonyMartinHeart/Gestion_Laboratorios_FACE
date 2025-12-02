const path = require('path');
const { WebpackPlugin } = require('@electron-forge/plugin-webpack');

module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [],
  plugins: [
    new WebpackPlugin({
      // 🔐 CSP solo para desarrollo (dev server + tu API local)
      devContentSecurityPolicy:
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "connect-src 'self' http://localhost:3001 http://localhost:9000 ws://localhost:9000",

      mainConfig: path.resolve(__dirname, 'webpack.main.config.js'),
      renderer: {
        config: path.resolve(__dirname, 'webpack.renderer.config.js'),
        entryPoints: [
          {
            html: path.resolve(__dirname, 'src/index.html'),
            js: path.resolve(__dirname, 'src/renderer/index.jsx'),
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
