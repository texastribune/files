"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("elements/lib/element");
const browser_1 = require("./browser");
class DirectoryElement extends element_1.CustomElement {
    constructor() {
        super(...arguments);
        this.mounted = null;
    }
    connectedCallback() {
        super.connectedCallback();
        if (this.parentElement instanceof browser_1.FileBrowser) {
            this.mounted = this.parentElement.rootDirectory;
            this.mounted.mount(this.directory);
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.mounted) {
            this.mounted.unount(this.directory);
            this.mounted = null;
        }
    }
}
exports.DirectoryElement = DirectoryElement;
