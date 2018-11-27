const path = require('path');

module.exports = {
  devtool: 'eval',
  entry: path.join(__dirname, 'test/bootstrapTests.js'),
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.join(__dirname, 'lib'),
          path.join(__dirname, 'test'),
        ],
      },
    ],
  },
};
