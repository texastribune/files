import {RemoteFS} from "../files/remote.js";
import {DirectoryElement} from "./files.js";


export class RemoteDirectoryElement extends DirectoryElement {
    public directory : RemoteFS;

    static urlAttribute : string = 'url';
    static nameAttribute : string = 'name';
    static rootIdAttribute : string = 'root-id';

    constructor(){
        super();

        this.directory = new RemoteFS(this.name, this.url, this.rootId);
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

    get rootId() : string {
        return this.getAttribute(RemoteDirectoryElement.rootIdAttribute) || "";
    }

    set rootId(value : string){
        this.setAttribute(RemoteDirectoryElement.rootIdAttribute, value);
    }

    updateFromAttributes(attributes: { [p: string]: string | null }): void {
        this.directory = new RemoteFS(this.name, this.url, this.rootId);
    }
}


customElements.define('remote-directory', RemoteDirectoryElement);