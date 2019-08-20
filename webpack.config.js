var path=require("path");
module.exports = {
    target: 'node',
    entry: {
      'main': './src/test.js',
      'debug': './src/debug.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    }
};