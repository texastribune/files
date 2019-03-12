import * as files from "./base";
declare class Database {
    private readonly name;
    private readyPromise;
    constructor(name: string);
    /**
     * An array of functions to perform on database for version upgrades. Each migration corresponds to a
     * database version. If there are 3 migration functions and a users database is on version 1, the last
     * two functions will be run. The final version of the database will be 3. The function can return a promise or
     * nothing.
     * @returns {function[]} - An array of functions the either can return nothing or a promise.
     */
    readonly migrations: ((db: IDBDatabase, transaction: IDBTransaction) => Promise<void>)[];
    getDB(): Promise<IDBDatabase>;
    close(): Promise<void>;
    clearAll(): Promise<void>;
}
interface UnSavedFileData {
    parentId: string;
    name: string;
    file: ArrayBuffer | null;
    mimeType: string;
    lastModified: string;
    created: string;
}
interface FileData extends UnSavedFileData {
    id: string;
}
declare class FileStore extends Database {
    private readonly objectStoreName;
    private readonly onFileChangeListeners;
    constructor(databaseName: string, storeName: string);
    readonly migrations: ((db: IDBDatabase, transaction: IDBTransaction) => Promise<void>)[];
    private onChange;
    addOnFilesChangedListener(listener: (id: string) => void): void;
    add(parentId: string, name: string, file?: ArrayBuffer | null, type?: string): Promise<FileData>;
    get(id: string): Promise<FileData>;
    update(id: string, updateFields: Object): Promise<FileData>;
    delete(id: string): Promise<void>;
    copy(sourceId: string, targetParentId: string): Promise<void>;
    move(sourceId: string, targetParentId: string): Promise<void>;
    search(id: string, query: string): Promise<void>;
    getChildren(id: string): Promise<any[]>;
    validate<T extends UnSavedFileData | FileData>(fileData: T): T;
}
export declare const database: FileStore;
/**
 * A storage class uses IndexedDB to store files locally in the browser.
 */
export declare class LocalStorageFile extends files.BasicFile {
    private _name;
    private _lastModified;
    private _size;
    readonly id: string;
    readonly created: Date;
    readonly mimeType: string;
    readonly url: null;
    readonly icon: null;
    extra: {};
    constructor(databaseData: FileData);
    readonly name: string;
    readonly lastModified: Date;
    readonly size: number;
    read(params?: Object): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: files.Directory): Promise<void>;
    move(targetDirectory: files.Directory): Promise<void>;
}
/**
 * A directory class uses IndexedDB to store files locally in the browser.
 */
export declare class LocalStorageDirectory extends files.Directory {
    private _name;
    private _lastModified;
    readonly id: string;
    readonly created: Date;
    readonly icon: null;
    extra: {};
    constructor(databaseData: FileData);
    readonly name: string;
    readonly lastModified: Date;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    getChildren(): Promise<files.File[]>;
    addFile(file: ArrayBuffer, name: string, mimeType: string): Promise<LocalStorageFile>;
    addDirectory(name: string): Promise<LocalStorageDirectory>;
    search(query: string): Promise<files.SearchResult[]>;
}
export declare class LocalStorageRoot extends LocalStorageDirectory {
    static id: string;
    constructor();
}
export {};
