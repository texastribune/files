/// <reference types="node" />
import * as files from "./base";
import { Stats } from "fs";
/**
 * A file on the local system using NodeJS file operations.
 */
export declare class NodeFile extends files.BasicFile {
    private stat;
    private path;
    private watcher;
    extra: {};
    constructor(path: string, stat?: Stats);
    readonly id: string;
    readonly name: string;
    readonly url: null;
    readonly icon: null;
    readonly size: number;
    readonly lastModified: Date;
    readonly created: Date;
    readonly mimeType: string;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: files.Directory): Promise<void>;
    move(targetDirectory: files.Directory): Promise<void>;
    search(query: string): Promise<void>;
    read(params?: Object): Promise<ArrayBuffer | SharedArrayBuffer>;
    write(data: ArrayBuffer): Promise<Buffer>;
}
export declare class NodeDirectory extends files.Directory {
    private stat;
    private path;
    private watcher;
    extra: {};
    constructor(path: string, stat?: Stats);
    readonly id: string;
    readonly name: string;
    readonly icon: null;
    readonly lastModified: Date;
    readonly created: Date;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: files.Directory): Promise<void>;
    move(targetDirectory: files.Directory): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<NodeFile>;
    addDirectory(name: string): Promise<NodeDirectory>;
    getChildren(): Promise<files.File[]>;
}
