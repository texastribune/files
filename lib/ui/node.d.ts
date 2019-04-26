import { NodeDirectory } from "../files/node";
import { DirectoryElement } from "./files";
export declare class NodeDirectoryElement extends DirectoryElement {
    protected directory: NodeDirectory;
    static pathAttribute: string;
    constructor();
    static readonly observedAttributes: string[];
    path: string;
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
