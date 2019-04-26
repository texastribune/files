import {RemoteFS} from "../files/remote";
import {DirectoryElement} from "./files";
import {FileBrowser} from "./browser";


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
        this.directory = new RemoteFS(this.url);
        if (this.parentElement instanceof FileBrowser){
            this.parentElement.removeChild(this);
            this.parentElement.appendChild(this);
        }
    }
}


customElements.define('remote-directory', RemoteDirectoryElement);