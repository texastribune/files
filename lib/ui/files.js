"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("elements/lib/element");
const memory_1 = require("../files/memory");
const browser_1 = require("./browser");
const local_1 = require("../files/local");
const remote_1 = require("../files/remote");
const node_1 = require("../files/node");
class DirectoryElement extends element_1.CustomElement {
    constructor() {
        super(...arguments);
        this.mounted = null;
    }
    connectedCallback() {
        if (this.parentElement instanceof browser_1.FileBrowser) {
            this.mounted = this.parentElement.rootDirectory;
            this.mounted.mount(this.directory);
            this.parentElement.refreshFiles();
        }
    }
    disconnectedCallback() {
        if (this.mounted) {
            this.mounted.unount(this.directory);
        }
    }
}
exports.DirectoryElement = DirectoryElement;
class MemoryDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new memory_1.MemoryDirectory(null, "root");
    }
    updateAttributes(attributes) {
    }
}
exports.MemoryDirectoryElement = MemoryDirectoryElement;
class LocalStorageDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new local_1.LocalStorageRoot();
    }
    updateAttributes(attributes) {
    }
}
exports.LocalStorageDirectoryElement = LocalStorageDirectoryElement;
class RemoteDirectoryElement extends DirectoryElement {
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
        this.directory.changeUrl(this.url);
    }
}
RemoteDirectoryElement.urlAttribute = "url";
exports.RemoteDirectoryElement = RemoteDirectoryElement;
class NodeDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new node_1.NodeDirectory("/");
    }
    static get observedAttributes() {
        return [NodeDirectoryElement.pathAttribute];
    }
    get path() {
        return this.getAttribute(NodeDirectoryElement.pathAttribute) || "";
    }
    set path(value) {
        this.setAttribute(NodeDirectoryElement.pathAttribute, value);
    }
    updateAttributes(attributes) {
        this.directory = new node_1.NodeDirectory(this.path);
        if (this.parentElement instanceof browser_1.FileBrowser) {
            this.parentElement.removeChild(this);
            this.parentElement.appendChild(this);
        }
    }
}
NodeDirectoryElement.pathAttribute = "path";
exports.NodeDirectoryElement = NodeDirectoryElement;
customElements.define('memory-directory', MemoryDirectoryElement);
customElements.define('local-directory', LocalStorageDirectoryElement);
customElements.define('remote-directory', RemoteDirectoryElement);
customElements.define('node-directory', NodeDirectoryElement);
