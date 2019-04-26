"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("elements/lib/element");
const browser_1 = require("./browser");
class DirectoryElement extends element_1.CustomElement {
    refresh() {
        super.refresh();
        if (this.parentElement instanceof browser_1.FileBrowser) {
            this.parentElement.rootDirectory = this.directory;
        }
    }
}
exports.DirectoryElement = DirectoryElement;
