import { RemoteFS } from "../files/remote";
import { DirectoryElement } from "./files";
export class RemoteDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new RemoteFS("root", "");
    }
    static get observedAttributes() {
        return [RemoteDirectoryElement.urlAttribute, RemoteDirectoryElement.nameAttribute];
    }
    get name() {
        return this.getAttribute(RemoteDirectoryElement.nameAttribute) || "";
    }
    set name(value) {
        this.setAttribute(RemoteDirectoryElement.nameAttribute, value);
    }
    get url() {
        return this.getAttribute(RemoteDirectoryElement.urlAttribute) || "";
    }
    set url(value) {
        this.setAttribute(RemoteDirectoryElement.urlAttribute, value);
    }
    updateAttributes(attributes) {
        this.directory = new RemoteFS(this.name, this.url);
    }
}
RemoteDirectoryElement.urlAttribute = 'url';
RemoteDirectoryElement.nameAttribute = 'name';
customElements.define('remote-directory', RemoteDirectoryElement);
