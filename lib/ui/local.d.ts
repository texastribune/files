import { LocalStorageRoot } from "../files/local.js";
import { DirectoryElement } from "./files.js";
export declare class LocalStorageDirectoryElement extends DirectoryElement {
    readonly directory: LocalStorageRoot;
    static nameAttribute: string;
    constructor();
    static get observedAttributes(): string[];
    get name(): string;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
