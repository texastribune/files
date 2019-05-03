import {LocalStorageRoot} from "../files/local.js";
import {DirectoryElement} from "./files.js";


export class LocalStorageDirectoryElement extends DirectoryElement {
    protected readonly directory : LocalStorageRoot;

    constructor(){
        super();

        this.directory = new LocalStorageRoot();
    }

    updateFromAttributes(attributes: { [p: string]: string | null }): void {
    }
}


customElements.define('local-directory', LocalStorageDirectoryElement);