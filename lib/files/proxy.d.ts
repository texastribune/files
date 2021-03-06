import * as files from "./base.js";
/**
 * Proxy to a file
 */
export declare class ProxyFile<T extends files.File> extends files.BasicFile {
    private readonly concreteFile;
    constructor(concreteFile: T);
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
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: files.Directory): Promise<void>;
    move(targetDirectory: files.Directory): Promise<void>;
}
/**
 * Proxy to a directory
 * @property {Directory} concreteDirectory - The directory to proxy
 */
export declare class ProxyDirectory<T extends files.Directory> extends files.Directory {
    readonly concreteDirectory: T;
    constructor(concreteDirectory: T);
    readonly id: string;
    readonly name: string;
    readonly directory: boolean;
    readonly url: string | null;
    readonly icon: string | null;
    readonly lastModified: Date;
    readonly created: Date;
    readonly extra: Object;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: files.Directory): Promise<void>;
    move(targetDirectory: files.Directory): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getFile(pathArray: string[]): Promise<files.File>;
    getChildren(): Promise<files.File[]>;
}
/**
 * Fires change event for local file changes such as write, rename, delete, etc.
 */
export declare class ChangeEventProxyFile<T extends files.File> extends ProxyFile<T> {
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
}
/**
 * Caches the children of the directory for when getChildren is called. Listens for change events
 * to invalidate the cache.
 */
export declare class CachedProxyDirectoryBase<T extends files.Directory> extends ProxyDirectory<T> {
    private readonly cachedRoot;
    protected readonly parentPath: string[];
    private pathCache;
    private childCache;
    protected constructor(concreteDirectory: T, parentPath: string[], rootDirectory: CachedProxyDirectory<T> | null);
    readonly root: CachedProxyDirectory<T>;
    readonly path: string[];
    protected createDescendant(file: files.File, parentPath: string[]): CachableFile;
    getFile(pathArray: string[]): Promise<CachableFile>;
    getChildren(): Promise<CachableFile[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    add(absolutePath: string[], file: CachableFile): void;
    getCached(absolutePath: string[]): CachableFile | null;
    clearCache(): void;
}
declare type CachableFile = CachedProxyDirectory<files.Directory> | ChangeEventProxyFile<files.File>;
export declare class CachedProxyDirectory<T extends files.Directory> extends CachedProxyDirectoryBase<T> {
    constructor(concreteDirectory: T, parentPath: string[], rootDirectory: CachedProxyDirectory<T>);
}
export declare class CachedProxyRootDirectory<T extends files.Directory> extends CachedProxyDirectoryBase<T> {
    constructor(concreteDirectory: T);
}
export {};
