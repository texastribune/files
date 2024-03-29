import {CustomElement} from "./elements/element.js";
import {Directory} from "../files/base.js";
import {FileBrowser} from "./browser.js";


/**
 * An custom element that represents a {@link Directory} instance. Can be added as a
 * child of {@link FileBrowser} to browse the directory in an HTML document.
 */
export abstract class DirectoryElement extends CustomElement {
    public abstract readonly directory : Directory;

    refresh(): void {
        super.refresh();
        if (this.parentElement instanceof FileBrowser){
            this.parentElement.rootDirectory = this.directory;
        }
    }
}
