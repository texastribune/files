import { LocalStorageRoot } from "../files/local.js";
import { DirectoryElement } from "./files.js";
export class LocalStorageDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new LocalStorageRoot();
    }
    static get observedAttributes() {
        return [LocalStorageDirectoryElement.nameAttribute];
    }
    get name() {
        return this.getAttribute(LocalStorageDirectoryElement.nameAttribute) || "root";
    }
    updateFromAttributes(attributes) {
        this.directory.name = this.name;
    }
}
LocalStorageDirectoryElement.nameAttribute = "name";
customElements.define('local-directory', LocalStorageDirectoryElement);
