import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
export declare class MemoryDirectoryElement extends DirectoryElement {
    protected readonly directory: MemoryDirectory;
    constructor();
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
