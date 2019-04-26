import {FileBrowser} from "./browser";
import {NodeDirectory} from "../files/node";
import {DirectoryElement} from "./files";


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
            let browser = this.parentElement;
            browser.removeChild(this);
            browser.appendChild(this);
        }
    }
}


customElements.define('node-directory', NodeDirectoryElement);