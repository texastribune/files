import { MemoryDirectory } from "../files/memory";
import { DirectoryElement } from "./files";
export declare class MemoryDirectoryElement extends DirectoryElement {
    protected readonly directory: MemoryDirectory;
    constructor();
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
