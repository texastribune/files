import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
export declare class MemoryDirectoryElement extends DirectoryElement {
    protected readonly directory: MemoryDirectory;
    constructor();
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
