import * as files from "./base";
/**
 * Proxy to an file
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
    addOnChangeListener(listener: (file: files.File) => void): void;
    read(): Promise<ArrayBuffer>;
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
    onChange(): void;
    addOnChangeListener(listener: (file: files.File) => void): void;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getChildren(): Promise<files.File[]>;
}
export declare class ChangeEventProxyFile extends ProxyFile {
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
}
export declare class ChangeEventProxyDirectory extends ProxyDirectory {
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getChildren(): Promise<files.File[]>;
}
export declare class CachedProxyDirectory extends ChangeEventProxyDirectory {
    private cachedChildren;
    private readonly parent;
    constructor(concreteDirectory: files.Directory, parentDirectory?: CachedProxyDirectory);
    readonly root: files.Directory;
    readonly path: files.Directory[];
    getChildren(): Promise<files.File[]>;
    clearCache(): void;
}
