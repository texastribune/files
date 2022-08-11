import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
export declare class MemoryDirectoryElement extends DirectoryElement {
    readonly directory: MemoryDirectory;
    static nameAttribute: string;
    constructor();
    static readonly observedAttributes: string[];
    readonly name: string;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
