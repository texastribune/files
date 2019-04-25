import {CustomElement} from "elements/lib/element";
import {Directory} from "../files/base";
import {MemoryDirectory} from "../files/memory";
import {FileBrowser} from "./browser";
import {VirtualDirectory} from "../files/virtual";
import {LocalStorageRoot} from "../files/local";
import {RemoteFS} from  "../files/remote";


export abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory : Directory;
    private mounted : VirtualDirectory<Directory> | null = null;

    connectedCallback(): void {
        if (this.parentElement instanceof FileBrowser){
            this.mounted = this.parentElement.rootDirectory;
            this.mounted.mount(this.directory);
            this.parentElement.refreshFiles();
        }
    }


    disconnectedCallback(): void {
        if (this.mounted){
            this.mounted.unount(this.directory);
        }
    }
}

export class MemoryDirectoryElement extends DirectoryElement {
    protected readonly directory : MemoryDirectory;

    constructor(){
        super();

        this.directory = new MemoryDirectory(null, "root");
    }

    updateAttributes(attributes: { [p: string]: string | null }): void {
    }
}

export class LocalStorageDirectoryElement extends DirectoryElement {
    protected readonly directory : LocalStorageRoot;

    constructor(){
        super();

        this.directory = new LocalStorageRoot();
    }

    updateAttributes(attributes: { [p: string]: string | null }): void {
    }
}

export class RemoteDirectoryElement extends DirectoryElement {
    protected directory : RemoteFS;

    static urlAttribute : string = "url";

    constructor(){
        super();

        this.directory = new RemoteFS("");
    }

    static get observedAttributes() {
        return [RemoteDirectoryElement.urlAttribute];
    }

    get url() : string {
        return this.getAttribute(RemoteDirectoryElement.urlAttribute) || "";
    }

    set url(value : string){
        this.setAttribute(RemoteDirectoryElement.urlAttribute, value);
    }

    updateAttributes(attributes: { [p: string]: string | null }): void {
        this.directory.changeUrl(this.url);
    }
}


customElements.define('memory-directory', MemoryDirectoryElement);
customElements.define('local-directory', LocalStorageDirectoryElement);
customElements.define('remote-directory', RemoteDirectoryElement);