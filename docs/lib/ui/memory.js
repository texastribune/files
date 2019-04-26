"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("../files/memory");
const files_1 = require("./files");
class MemoryDirectoryElement extends files_1.DirectoryElement {
    constructor() {
        super();
        this.directory = new memory_1.MemoryDirectory(null, "root");
    }
    updateAttributes(attributes) {
    }
}
exports.MemoryDirectoryElement = MemoryDirectoryElement;
customElements.define('memory-directory', MemoryDirectoryElement);
