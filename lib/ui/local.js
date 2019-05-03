import { LocalStorageRoot } from "../files/local.js";
import { DirectoryElement } from "./files.js";
export class LocalStorageDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new LocalStorageRoot();
    }
    updateFromAttributes(attributes) {
    }
}
customElements.define('local-directory', LocalStorageDirectoryElement);
