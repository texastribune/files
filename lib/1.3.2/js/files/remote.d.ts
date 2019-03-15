import * as files from "./base";
interface FileData {
    id: string;
    name: string;
    directory: boolean;
    mimeType: string;
    lastModified: string;
    created: string;
    url: string;
    icon: string | null;
    size: number;
}
declare class RemoteFile extends files.BasicFile {
    private readonly parent;
    private readonly fileData;
    readonly extra: {};
    constructor(parent: RemoteDirectory, fileData: FileData);
    readonly id: string;
    readonly name: string;
    readonly mimeType: string;
    readonly lastModified: Date;
    readonly created: Date;
    readonly url: string;
    readonly icon: string | null;
    readonly size: number;
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
}
declare class RemoteDirectory extends files.Directory {
    static addDirectoryName: string;
    static addFileName: string;
    static renameFileName: string;
    static deleteFileName: string;
    static moveFileName: string;
    static searchFileName: string;
    private readonly parent;
    private readonly fileData;
    readonly extra: {};
    constructor(parent: RemoteDirectory | null, fileData: FileData);
    readonly id: string;
    readonly name: string;
    readonly lastModified: Date;
    readonly created: Date;
    readonly url: string;
    readonly icon: string | null;
    readonly size: number;
    read(): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<RemoteFile>;
    addDirectory(name: string): Promise<RemoteDirectory>;
    getChildren(): Promise<files.File[]>;
}
export declare class RemoteFS extends RemoteDirectory {
    constructor(url: string);
}
export {};
