import { LocalStorageRoot } from "../files/local";
import { DirectoryElement } from "./files";
export class LocalStorageDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new LocalStorageRoot();
    }
    updateAttributes(attributes) {
    }
}
customElements.define('local-directory', LocalStorageDirectoryElement);
