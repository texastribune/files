import { CustomElement } from "./elements/element.js";
import { FileBrowser } from "./browser.js";
/**
 * An custom element that represents a {@link Directory} instance. Can be added as a
 * child of {@link FileBrowser} to browse the directory in an HTML document.
 */
export class DirectoryElement extends CustomElement {
    refresh() {
        super.refresh();
        if (this.parentElement instanceof FileBrowser) {
            this.parentElement.rootDirectory = this.directory;
        }
    }
}
