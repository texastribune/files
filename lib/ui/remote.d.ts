import { RemoteFS } from "../files/remote.js";
import { DirectoryElement } from "./files.js";
export declare class RemoteDirectoryElement extends DirectoryElement {
    directory: RemoteFS;
    static urlAttribute: string;
    static nameAttribute: string;
    constructor();
    static readonly observedAttributes: string[];
    name: string;
    url: string;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
