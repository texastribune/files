import { RemoteFS } from "../files/remote.js";
import { DirectoryElement } from "./files.js";
export declare class RemoteDirectoryElement extends DirectoryElement {
    directory: RemoteFS;
    static urlAttribute: string;
    static nameAttribute: string;
    static rootIdAttribute: string;
    constructor();
    static get observedAttributes(): string[];
    get name(): string;
    set name(value: string);
    get url(): string;
    set url(value: string);
    get rootId(): string;
    set rootId(value: string);
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
