import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
import { VirtualFS } from "../files/virtual.js";
import { Directory } from "../files/base.js";
export declare class VirtualDirectoryElement extends DirectoryElement {
    readonly directory: VirtualFS<MemoryDirectory>;
    constructor();
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    addDirectory(directory: Directory): Promise<void>;
    removeDirectory(directory: Directory): Promise<void>;
}
