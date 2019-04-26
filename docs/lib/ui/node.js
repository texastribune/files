"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("../files/node");
const files_1 = require("./files");
class NodeDirectoryElement extends files_1.DirectoryElement {
    constructor() {
        super();
        this.directory = new node_1.NodeDirectory("/");
    }
    static get observedAttributes() {
        return [NodeDirectoryElement.pathAttribute];
    }
    get path() {
        return this.getAttribute(NodeDirectoryElement.pathAttribute) || "";
    }
    set path(value) {
        this.setAttribute(NodeDirectoryElement.pathAttribute, value);
    }
    updateAttributes(attributes) {
        this.directory = new node_1.NodeDirectory(this.path);
    }
}
NodeDirectoryElement.pathAttribute = "path";
exports.NodeDirectoryElement = NodeDirectoryElement;
customElements.define('node-directory', NodeDirectoryElement);
