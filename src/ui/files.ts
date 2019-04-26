import {CustomElement} from "elements/lib/element";
import {Directory} from "../files/base";
import {FileBrowser} from "./browser";


export abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory : Directory;

    refresh(): void {
        super.refresh();
        if (this.parentElement instanceof FileBrowser){
            this.parentElement.rootDirectory = this.directory;
        }
    }
}
