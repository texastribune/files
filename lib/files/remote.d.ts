import * as files from "./base.js";
import { Directory } from "./base.js";
interface FileData {
    id: string;
    name: string;
    directory: boolean;
    mimeType: string;
    lastModified: string;
    created: string;
    url: string | null;
    icon: string | null;
    size: number;
}
declare class RemoteFile extends files.BasicFile {
    private readonly parent;
    private readonly fileData;
    private readonly apiUrl;
    readonly extra: {};
    constructor(parent: RemoteDirectory, fileData: FileData, apiUrl: URL);
    readonly id: string;
    readonly name: string;
    readonly mimeType: string;
    readonly lastModified: Date;
    readonly created: Date;
    private readonly urlObject;
    readonly url: string;
    readonly icon: string | null;
    readonly size: number;
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: Directory): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
}
declare class RemoteDirectory extends files.Directory {
    static addDirectoryName: string;
    static addFileName: string;
    static renameFileName: string;
    static deleteFileName: string;
    static copyFileName: string;
    static moveFileName: string;
    static searchFileName: string;
    private readonly parent;
    private readonly fileData;
    private readonly apiUrl;
    readonly extra: {};
    constructor(parent: RemoteDirectory | null, fileData: FileData, apiUrl: URL);
    readonly id: string;
    readonly name: string;
    readonly lastModified: Date;
    readonly created: Date;
    private readonly urlObject;
    readonly url: string;
    readonly icon: string | null;
    readonly size: number;
    read(): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: Directory): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(data: ArrayBuffer, filename: string, mimeType?: string): Promise<RemoteFile>;
    addDirectory(name: string): Promise<RemoteDirectory>;
    getChildren(): Promise<files.File[]>;
}
export declare class RemoteFS extends RemoteDirectory {
    constructor(name: string, apiUrl: URL | string);
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
}
export {};
