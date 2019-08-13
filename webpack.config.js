var path=require("path");
module.exports = {
    target: 'node',
    entry: './src/test.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    }
};