import {LocalStorageRoot} from "../files/local";
import {DirectoryElement} from "./files";


export class LocalStorageDirectoryElement extends DirectoryElement {
    protected readonly directory : LocalStorageRoot;

    constructor(){
        super();

        this.directory = new LocalStorageRoot();
    }

    updateAttributes(attributes: { [p: string]: string | null }): void {
    }
}


customElements.define('local-directory', LocalStorageDirectoryElement);