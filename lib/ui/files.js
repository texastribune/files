import { CustomElement } from "elements/lib/element";
import { FileBrowser } from "./browser";
export class DirectoryElement extends CustomElement {
    refresh() {
        super.refresh();
        if (this.parentElement instanceof FileBrowser) {
            this.parentElement.rootDirectory = this.directory;
        }
    }
}
