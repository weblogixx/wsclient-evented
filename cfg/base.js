var path = require('path');

var port = 8000;
var publicPath = '/';

module.exports = {
  port: port,
  debug: true,
  output: {
    path: path.join(__dirname, '/../dist'),
    filename: 'wsclient-evented.js',
    publicPath: publicPath
  },
  devServer: {
    contentBase: './lib/',
    port: port,
    publicPath: publicPath,
    noInfo: false
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'lib'),
        loader: 'eslint-loader'
      }
    ],
    loaders: [
    ]
  }
};
