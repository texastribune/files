import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
export class MemoryDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new MemoryDirectory(null, "root");
    }
    static get observedAttributes() {
        return [MemoryDirectoryElement.nameAttribute];
    }
    get name() {
        return this.getAttribute(MemoryDirectoryElement.nameAttribute) || "root";
    }
    updateFromAttributes(attributes) {
        this.directory.name = this.name;
    }
}
MemoryDirectoryElement.nameAttribute = "name";
customElements.define('memory-directory', MemoryDirectoryElement);
