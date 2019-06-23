const path = require('path');
const ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = {
  entry: [path.join(__dirname, 'build/module/index.js')],
  output: {
    path: path.join(__dirname, '/'),
    filename: 'index.min.js'
  },
  plugins: [
    new ClosureCompilerPlugin({
      compiler: {
        language_in: 'ECMASCRIPT_NEXT',
        language_out: 'ECMASCRIPT_NEXT',
        compilation_level: 'ADVANCED'
      },
      concurrency: 3
    })
  ]
};
