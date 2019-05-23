import * as files from "./base.js";
import { ProxyFile } from "./proxy.js";
import { VirtualDirectory } from "./virtual.js";
/**
 * Fires change event for local file changes such as write, rename, delete, etc.
 */
export declare class BrowserProxyFile<T extends files.File> extends ProxyFile<T> {
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
}
/**
 * Fires change event for local file changes such as rename, delete, etc. as well as
 * when those changes happen on children of the directory. Caches the children of the directory for when getChildren
 * is called. Listens for change events to invalidate the cache.
 */
export declare class BrowserProxyDirectory<T extends files.Directory> extends VirtualDirectory<T> {
    protected readonly parent: CachedProxyDirectory<T> | null;
    private cachedChildren;
    constructor(concreteDirectory: T, parentDirectory?: CachedProxyDirectory<T>);
    dispatchChangeEvent(): void;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getChildren(): Promise<files.File[]>;
    clearCache(): void;
}
/**
 * Caches the children of the directory for when getChildren is called. Listens for change events
 * to invalidate the cache.
 */
export declare class CachedProxyDirectory<T extends files.Directory> extends BrowserProxyDirectory<T> {
    private cachedChildren;
    constructor(concreteDirectory: T, parentDirectory?: CachedProxyDirectory<T>);
    dispatchChangeEvent(): void;
    readonly root: CachedProxyDirectory<T>;
    readonly path: files.Directory[];
    protected createChild(child: files.File): BrowserProxyDirectory<files.Directory> | BrowserProxyFile<files.File>;
    getChildren(): Promise<files.File[]>;
    clearCache(): void;
}
