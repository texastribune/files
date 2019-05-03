import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
export class MemoryDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new MemoryDirectory(null, "root");
    }
    updateFromAttributes(attributes) {
    }
}
customElements.define('memory-directory', MemoryDirectoryElement);
