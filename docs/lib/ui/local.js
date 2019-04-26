"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const local_1 = require("../files/local");
const files_1 = require("./files");
class LocalStorageDirectoryElement extends files_1.DirectoryElement {
    constructor() {
        super();
        this.directory = new local_1.LocalStorageRoot();
    }
    updateAttributes(attributes) {
    }
}
exports.LocalStorageDirectoryElement = LocalStorageDirectoryElement;
customElements.define('local-directory', LocalStorageDirectoryElement);
