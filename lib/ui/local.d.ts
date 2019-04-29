import { LocalStorageRoot } from "../files/local.js";
import { DirectoryElement } from "./files.js";
export declare class LocalStorageDirectoryElement extends DirectoryElement {
    protected readonly directory: LocalStorageRoot;
    constructor();
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
