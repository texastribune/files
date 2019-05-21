import { CustomElement } from "elements/lib/element.js";
import { FileBrowser } from "./browser.js";
/**
 * An custom element that represents a {@link Directory} instance. Can be added as a
 * child of {@link FileBrowser} to browse the directory in an HTML document.
 */
export class DirectoryElement extends CustomElement {
    connectedCallback() {
        super.connectedCallback();
        if (this.parentElement instanceof FileBrowser) {
            this.parentElement.mountDirectory(this.directory);
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.parentElement instanceof FileBrowser) {
            this.parentElement.unMountDirectory(this.directory);
        }
    }
}
