import { RemoteFS } from "../files/remote";
import { DirectoryElement } from "./files";
export declare class RemoteDirectoryElement extends DirectoryElement {
    protected directory: RemoteFS;
    static urlAttribute: string;
    static nameAttribute: string;
    constructor();
    static readonly observedAttributes: string[];
    name: string;
    url: string;
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
