const path = require('path');

module.exports = {
  entry: [path.join(__dirname, '.tmp/index.js')],
  output: {
    path: path.join(__dirname, '/build'),
    filename: 'index.js'
  },
  externals: [],
  optimization: {
    minimize: false
  }
};
