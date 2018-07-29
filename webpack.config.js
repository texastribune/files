const path = require('path');
const version = require("./package.json").version;

console.log("VERSION", version);

module.exports = {
    mode: "production",
    entry: `./src/${version}`,
    output: {
        filename: `[name].${version}.js`,
        libraryTarget: "global",
        libraryExport: "default"
    },
    externals: ['fs', 'path']
};