const path = require('path');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = {
  entry: [path.join(__dirname, 'build/main/index.js')],
  output: {
    path: path.join(__dirname, '/'),
    filename: 'index.min.js'
  },
  plugins: [
    new ClosureCompilerPlugin({
      compiler: {
        language_in: 'ECMASCRIPT6',
        language_out: 'ECMASCRIPT5',
        compilation_level: 'ADVANCED'
      },
      concurrency: 3
    })
  ]
};
