import {CustomElement} from "elements/lib/element.js";
import {Directory} from "../files/base.js";
import {FileBrowser} from "./browser.js";


/**
 * An custom element that represents a {@link Directory} instance. Can be added as a
 * child of {@link FileBrowser} to browse the directory in an HTML document.
 */
export abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory : Directory;


    connectedCallback(): void {
        super.connectedCallback();

        if (this.parentElement instanceof FileBrowser){
            this.parentElement.mountDirectory(this.directory);
        }
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();

        if (this.parentElement instanceof FileBrowser){
            this.parentElement.unMountDirectory(this.directory);
        }
    }
}
