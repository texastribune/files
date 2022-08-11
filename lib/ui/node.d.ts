import { NodeDirectory } from "../files/node.js";
import { DirectoryElement } from "./files.js";
export declare class NodeDirectoryElement extends DirectoryElement {
    directory: NodeDirectory;
    static pathAttribute: string;
    constructor();
    static get observedAttributes(): string[];
    get path(): string;
    set path(value: string);
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
