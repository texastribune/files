import {RemoteFS} from "../files/remote.js";
import {DirectoryElement} from "./files.js";


export class RemoteDirectoryElement extends DirectoryElement {
    protected directory : RemoteFS;

    static urlAttribute : string = 'url';
    static nameAttribute : string = 'name';

    constructor(){
        super();

        this.directory = new RemoteFS("root", "");
    }

    static get observedAttributes() {
        return [RemoteDirectoryElement.urlAttribute, RemoteDirectoryElement.nameAttribute];
    }

    get name() : string {
        return this.getAttribute(RemoteDirectoryElement.nameAttribute) || "";
    }

    set name(value : string){
        this.setAttribute(RemoteDirectoryElement.nameAttribute, value);
    }

    get url() : string {
        return this.getAttribute(RemoteDirectoryElement.urlAttribute) || "";
    }

    set url(value : string){
        this.setAttribute(RemoteDirectoryElement.urlAttribute, value);
    }

    updateFromAttributes(attributes: { [p: string]: string | null }): void {
        this.directory = new RemoteFS(this.name, this.url);
    }
}


customElements.define('remote-directory', RemoteDirectoryElement);