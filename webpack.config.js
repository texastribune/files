const path = require('path');
const version = require("./package.json").version;

console.log("VERSION", version);

module.exports = {
    entry: `./index.js`,
    output: {
        filename: `bundle.${version}.js`,
        libraryTarget: "var",
        library: "systemx"
    },
    devtool: 'source-map',
};