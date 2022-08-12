var path = require('path');

module.exports = {
  mode: 'development',
  watch: true,
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};