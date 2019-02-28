import * as files from "./base";
import { Directory } from "./base";
declare class Database {
    name: string;
    _readyPromise: Promise<IDBDatabase> | null;
    constructor(name: string);
    /**
     * An array of functions to perform on database for version upgrades. Each migration corresponds to a
     * database version. If there are 3 migration functions and a users database is on version 1, the last
     * two functions will be run. The final version of the database will be 3. The function can return a promise or
     * nothing.
     * @returns {function[]} - An array of functions the either can return nothing or a promise.
     */
    static readonly migrations: ((db: IDBDatabase, transaction: IDBTransaction) => Promise<void>)[];
    getDB(): Promise<IDBDatabase>;
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
    static readonly objectStoreName: string;
    static readonly migrations: ((db: IDBDatabase, transaction: IDBTransaction) => Promise<void>)[];
    add(parentId: string, name: string, file?: ArrayBuffer | null, type?: string): Promise<FileData>;
    get(id: string): Promise<FileData>;
    update(id: string, updateFields: Object): Promise<FileData>;
    delete(id: string): Promise<void>;
    copy(sourceId: string, targetParentId: string): Promise<void>;
    move(sourceId: string, targetParentId: string): Promise<void>;
    search(id: string, query: string): Promise<void>;
    getChildren(id: string): Promise<any[]>;
    validate(fileData: UnSavedFileData | FileData): FileData | UnSavedFileData;
    close(): Promise<void>;
    clearAll(): Promise<void>;
}
export declare const database: FileStore;
/**
 * A storage class uses IndexedDB to store files locally in the browser.
 */
export declare class LocalStorageFile extends files.BasicFile {
    private _id;
    private _name;
    private _created;
    private _lastModified;
    private _mimeType;
    private _size;
    readonly url: null;
    readonly icon: null;
    extra: {};
    constructor(databaseData: FileData);
    readonly id: string;
    readonly name: string;
    readonly lastModified: Date;
    readonly created: Date;
    readonly mimeType: string;
    readonly size: number;
    read(params?: Object): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: Directory): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
}
/**
 * A directory class uses IndexedDB to store files locally in the browser.
 */
export declare class LocalStorageDirectory extends files.Directory {
    private _id;
    private _name;
    private _created;
    private _lastModified;
    readonly icon: null;
    extra: {};
    constructor(databaseData: FileData);
    readonly id: string;
    readonly name: string;
    readonly created: Date;
    readonly lastModified: Date;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    getChildren(): Promise<files.File[]>;
    addFile(file: ArrayBuffer, name: string, mimeType: string): Promise<LocalStorageFile>;
    addDirectory(name: string): Promise<LocalStorageDirectory>;
    search(query: string): Promise<files.File[]>;
}
export declare class LocalStorageRoot extends LocalStorageDirectory {
    constructor();
}
export {};
