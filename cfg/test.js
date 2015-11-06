var path = require('path');

module.exports = {
  devtool: 'eval',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.join(__dirname, '/../lib'),
          path.join(__dirname, '/../test')
        ]
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.join(__dirname, '/../lib')
        ],
        loader: 'isparta'
      }
    ]
  }
};
