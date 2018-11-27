/* eslint no-confusing-arrow: 0 */
const path = require('path');

module.exports = {
  devtool: 'sourcemap',
  entry: path.join(__dirname, 'lib/browser.js'),
  mode: 'production',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        include: path.join(__dirname, 'lib'),
        loader: 'eslint-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'lib'),
      },
    ],
  },
  output: {
    filename: chunkData => chunkData.chunk.name === 'main' ? 'wsclientevented.js' : '[name].js',
    path: path.join(__dirname, 'dist'),
  },
};
