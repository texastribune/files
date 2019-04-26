"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const remote_1 = require("../files/remote");
const files_1 = require("./files");
const browser_1 = require("./browser");
class RemoteDirectoryElement extends files_1.DirectoryElement {
    constructor() {
        super();
        this.directory = new remote_1.RemoteFS("");
    }
    static get observedAttributes() {
        return [RemoteDirectoryElement.urlAttribute];
    }
    get url() {
        return this.getAttribute(RemoteDirectoryElement.urlAttribute) || "";
    }
    set url(value) {
        this.setAttribute(RemoteDirectoryElement.urlAttribute, value);
    }
    updateAttributes(attributes) {
        this.directory = new remote_1.RemoteFS(this.url);
        if (this.parentElement instanceof browser_1.FileBrowser) {
            let browser = this.parentElement;
            browser.removeChild(this);
            browser.appendChild(this);
        }
    }
}
RemoteDirectoryElement.urlAttribute = "url";
exports.RemoteDirectoryElement = RemoteDirectoryElement;
customElements.define('remote-directory', RemoteDirectoryElement);
