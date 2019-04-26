import {RemoteFS} from "../files/remote";
import {DirectoryElement} from "./files";


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


customElements.define('remote-directory', RemoteDirectoryElement);