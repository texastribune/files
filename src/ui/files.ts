import {CustomElement} from "elements/lib/element";
import {Directory} from "../files/base";
import {MemoryDirectory} from "../files/memory";
import {FileBrowser} from "./browser";
import {VirtualDirectory} from "../files/virtual";
import {LocalStorageRoot} from "../files/local";
import {RemoteFS} from  "../files/remote";
import {NodeDirectory} from "../files/node";


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

export class NodeDirectoryElement extends DirectoryElement {
    protected directory : NodeDirectory;

    static pathAttribute : string = "path";

    constructor(){
        super();

        this.directory = new NodeDirectory("/");
    }

    static get observedAttributes() {
        return [NodeDirectoryElement.pathAttribute];
    }

    get path() : string {
        return this.getAttribute(NodeDirectoryElement.pathAttribute) || "";
    }

    set path(value : string){
        this.setAttribute(NodeDirectoryElement.pathAttribute, value);
    }

    updateAttributes(attributes: { [p: string]: string | null }): void {
        this.directory = new NodeDirectory(this.path);
        if (this.parentElement instanceof FileBrowser){
            this.parentElement.removeChild(this);
            this.parentElement.appendChild(this);
        }
    }
}


customElements.define('memory-directory', MemoryDirectoryElement);
customElements.define('local-directory', LocalStorageDirectoryElement);
customElements.define('remote-directory', RemoteDirectoryElement);
customElements.define('node-directory', NodeDirectoryElement);