import {CustomElement} from "elements/lib/element";
import {Directory} from "../files/base";
import {FileBrowser} from "./browser";
import {VirtualDirectory} from "../files/virtual";


export abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory : Directory;
    private mounted : VirtualDirectory<Directory> | null = null;

    connectedCallback(): void {
        if (this.parentElement instanceof FileBrowser){
            this.mounted = this.parentElement.rootDirectory;
            this.mounted.mount(this.directory);
        }
    }


    disconnectedCallback(): void {
        if (this.mounted){
            this.mounted.unount(this.directory);
            this.mounted = null;
        }
    }
}
