import { LocalStorageRoot } from "../files/local";
import { DirectoryElement } from "./files";
export declare class LocalStorageDirectoryElement extends DirectoryElement {
    protected readonly directory: LocalStorageRoot;
    constructor();
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
