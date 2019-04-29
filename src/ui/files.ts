import {CustomElement} from "elements/lib/element.js";
import {Directory} from "../files/base.js";
import {FileBrowser} from "./browser.js";


export abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory : Directory;

    refresh(): void {
        super.refresh();
        if (this.parentElement instanceof FileBrowser){
            this.parentElement.rootDirectory = this.directory;
        }
    }
}
