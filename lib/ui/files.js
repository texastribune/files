import { CustomElement } from "elements/lib/element.js";
import { FileBrowser } from "./browser.js";
export class DirectoryElement extends CustomElement {
    refresh() {
        super.refresh();
        if (this.parentElement instanceof FileBrowser) {
            this.parentElement.rootDirectory = this.directory;
        }
    }
}
