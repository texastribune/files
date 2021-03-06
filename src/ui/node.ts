import {NodeDirectory} from "../files/node.js";
import {DirectoryElement} from "./files.js";


export class NodeDirectoryElement extends DirectoryElement {
    directory : NodeDirectory;

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

    updateFromAttributes(attributes: { [p: string]: string | null }): void {
        this.directory = new NodeDirectory(this.path);
    }
}


customElements.define('node-directory', NodeDirectoryElement);