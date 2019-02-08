import * as files from "./base.js";
export declare class MemoryFile extends files.BasicFile {
    readonly id: string;
    readonly created: Date;
    readonly icon: null;
    readonly mimeType: string;
    readonly url: null;
    readonly extra: {};
    private parent;
    private fileData;
    name: string;
    lastModified: Date;
    constructor(parent: MemoryDirectory, name: string, mimeType?: string, data?: ArrayBuffer);
    readonly size: number;
    read(params: Object): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
}
export declare class MemoryDirectory extends files.Directory {
    readonly id: string;
    readonly created: Date;
    readonly icon: null;
    readonly extra: {};
    private parent;
    name: string;
    private _children;
    constructor(parent: MemoryDirectory | null, name: string);
    readonly lastModified: Date;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
    getChildren(): Promise<(MemoryFile | MemoryDirectory)[]>;
    search(query: string): Promise<files.File[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<MemoryFile>;
    addDirectory(name: string): Promise<MemoryDirectory>;
    addChild(memoryFile: MemoryFile | MemoryDirectory): void;
    removeChild(memoryFile: MemoryFile | MemoryDirectory): void;
}
