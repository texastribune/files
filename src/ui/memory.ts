import {MemoryDirectory} from "../files/memory";
import {DirectoryElement} from "./files";


export class MemoryDirectoryElement extends DirectoryElement {
    protected readonly directory : MemoryDirectory;

    constructor(){
        super();

        this.directory = new MemoryDirectory(null, "root");
    }

    updateAttributes(attributes: { [p: string]: string | null }): void {
    }
}


customElements.define('memory-directory', MemoryDirectoryElement);