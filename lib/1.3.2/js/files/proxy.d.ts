import * as files from "./base";
/**
 * Proxy to an file
 * @property {BasicFile} concreteFile - The file to proxy
 */
export declare class ProxyFile extends files.BasicFile {
    private readonly concreteFile;
    constructor(concreteFile: files.File);
    readonly id: string;
    readonly name: string;
    readonly directory: boolean;
    readonly url: string | null;
    readonly icon: string | null;
    readonly size: number;
    readonly mimeType: string;
    readonly lastModified: Date;
    readonly created: Date;
    readonly extra: Object;
    read(params?: Object): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
}
/**
 * Proxy to an file
 * @property {Directory} concreteDirectory - The directory to proxy
 */
export declare class ProxyDirectory extends files.Directory {
    private readonly concreteDirectory;
    constructor(concreteDirectory: files.Directory);
    readonly id: string;
    readonly name: string;
    readonly directory: boolean;
    readonly url: null;
    readonly icon: string | null;
    readonly lastModified: Date;
    readonly created: Date;
    readonly extra: Object;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    search(query: string): Promise<files.File[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getFile(pathArray: string[]): Promise<files.File>;
    getChildren(): Promise<files.File[]>;
}
export declare class CachedProxyDirectory extends ProxyDirectory {
    private cachedChildren;
    getChildren(): Promise<files.File[]>;
    clearCache(): void;
}
