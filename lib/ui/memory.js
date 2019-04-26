import { MemoryDirectory } from "../files/memory";
import { DirectoryElement } from "./files";
export class MemoryDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new MemoryDirectory(null, "root");
    }
    updateAttributes(attributes) {
    }
}
customElements.define('memory-directory', MemoryDirectoryElement);
