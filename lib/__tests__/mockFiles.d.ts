import { MemoryDirectory, MemoryFile } from "../files/memory.js";
import { Requester } from "../utils.js";
import * as files from "../files/base.js";
export declare class MockBackendDirectory extends MemoryDirectory {
    static addDirectoryName: string;
    static addFileName: string;
    static renameFileName: string;
    static deleteFileName: string;
    static copyFileName: string;
    static moveFileName: string;
    static searchFileName: string;
    private readonly apiChildren;
    readonly url: string;
    private getDirChildById;
    getById(id: string): Promise<files.File>;
    getChildren(): Promise<files.File[]>;
    addFileSync(fileData: ArrayBuffer, filename: string, mimeType: string): MemoryFile;
    addDirectorySync(name: string): MemoryDirectory;
}
export declare class MockRemoteRequester implements Requester {
    private readonly rootDirectory;
    constructor(rootDirectory: MockBackendDirectory);
    private getId;
    request(url: URL, query?: {
        [p: string]: string;
    }, data?: FormData | Blob | null, method?: "GET" | "POST" | "PUT" | "DELETE"): Promise<ArrayBuffer>;
}
