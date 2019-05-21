import {MemoryDirectory} from "../files/memory.js";
import {DirectoryElement} from "./files.js";


export class MemoryDirectoryElement extends DirectoryElement {
    protected readonly directory : MemoryDirectory;

    static nameAttribute = "name";

    constructor(){
        super();

        this.directory = new MemoryDirectory(null, "root");
    }

    static get observedAttributes() {
        return [MemoryDirectoryElement.nameAttribute];
    }

    get name() : string {
        return this.getAttribute(MemoryDirectoryElement.nameAttribute) || "root";
    }

    updateFromAttributes(attributes: { [p: string]: string | null }): void {
        this.directory.name = this.name;
    }
}


customElements.define('memory-directory', MemoryDirectoryElement);