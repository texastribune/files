import { NodeDirectory } from "../files/node.js";
import { DirectoryElement } from "./files.js";
export class NodeDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new NodeDirectory("/");
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
        this.directory = new NodeDirectory(this.path);
    }
}
NodeDirectoryElement.pathAttribute = "path";
customElements.define('node-directory', NodeDirectoryElement);
