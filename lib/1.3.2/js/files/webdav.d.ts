import { Stat, ClientInterface } from "webdav";
import * as files from "./base";
declare class WebDavFile extends files.BasicFile {
    private readonly client;
    private readonly stat;
    readonly extra: {};
    constructor(client: ClientInterface, stat: Stat);
    readonly id: string;
    readonly name: string;
    readonly mimeType: string;
    readonly lastModified: Date;
    readonly created: Date;
    readonly url: string;
    readonly icon: null;
    readonly size: number;
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
}
declare class WebDavDirectory extends files.Directory {
    private readonly client;
    private readonly stat;
    readonly extra: {};
    constructor(client: ClientInterface, stat: Stat);
    readonly id: string;
    readonly name: string;
    readonly lastModified: Date;
    readonly created: Date;
    readonly url: null;
    readonly icon: null;
    readonly size: number;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<WebDavFile>;
    addDirectory(name: string): Promise<WebDavDirectory>;
    getChildren(): Promise<files.File[]>;
}
export declare class WebDavRoot extends WebDavDirectory {
    constructor(url: string, path: string);
}
export {};
