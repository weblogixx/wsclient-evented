var path = require('path');
var webpack = require('webpack');

var config = {
  debug: true,
  entry: {
    index: [ path.join(__dirname, '../lib/index.js') ],
    browser: [ path.join(__dirname, '../lib/browser.js') ]
  },
  output: {
    path: path.join(__dirname, '/../dist'),
    filename: '[name].js'
  },
  cache: false,
  devtool: 'sourcemap',
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'lib'),
        loader: 'eslint-loader'
      }
    ],
    loaders: [
      {
        test: /\.(js)$/,
        loader: 'babel',
        include: path.join(__dirname, '/../lib')
      }
    ]
  }
};

module.exports = config;
