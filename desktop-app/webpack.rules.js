module.exports = [
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          ['@babel/preset-env', { targets: { electron: '38' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    },
  },
  {
    test: /\.css$/i,
    use: ['style-loader', 'css-loader'],
  },
  {
    test: /\.(png|jpe?g|gif|svg)$/i,
    type: 'asset/resource',
  },
];
