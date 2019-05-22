import {LocalStorageRoot} from "../files/local.js";
import {DirectoryElement} from "./files.js";


export class LocalStorageDirectoryElement extends DirectoryElement {
    public readonly directory : LocalStorageRoot;

    static nameAttribute = "name";

    constructor(){
        super();

        this.directory = new LocalStorageRoot();
    }

    static get observedAttributes() {
        return [LocalStorageDirectoryElement.nameAttribute];
    }

    get name() : string {
        return this.getAttribute(LocalStorageDirectoryElement.nameAttribute) || "root";
    }

    updateFromAttributes(attributes: { [p: string]: string | null }): void {
        this.directory.name = this.name;
    }
}


customElements.define('local-directory', LocalStorageDirectoryElement);