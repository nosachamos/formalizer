const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: [path.join(__dirname, '.tmp/index.js')],
  output: {
    path: path.join(__dirname, '/build'),
    filename: 'index.min.js'
  },
  externals: ['react', 'validator'],
  optimization: {
    minimizer: [new UglifyJsPlugin()]
  }
};
