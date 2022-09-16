import * as files from "../files/base.js";
export declare class ProcessFile extends files.BasicFile {
    readonly id: string;
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    protected constructor();
    get name(): string;
    get url(): null;
    get icon(): null;
    get size(): number;
    get mimeType(): string;
    delete(): Promise<void>;
    read(): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
}
export declare class ProcessDirectory extends files.Directory {
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    get id(): string;
    get name(): string;
    get url(): null;
    get icon(): null;
    getChildren(): Promise<ProcessFile[]>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
}
