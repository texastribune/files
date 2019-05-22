import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
import { VirtualFS } from "../files/virtual.js";
import { Directory } from "../files/base.js";
export declare class VirtualDirectoryElement extends DirectoryElement {
    readonly directory: VirtualFS<MemoryDirectory>;
    /**
     * @event
     */
    static EVENT_MOUNTED: string;
    /**
     * @event
     */
    static EVENT_UNMOUNTED: string;
    constructor();
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    addDirectory(directory: Directory): Promise<void>;
    removeDirectory(directory: Directory): Promise<void>;
}
