import * as files from "./base.js";
import { SearchResult } from "./base.js";
import { Requester } from "../utils.js";
interface S3ObjectData {
    Key: string;
    LastModified: string;
    Size: number;
    ETag: string;
    StorageClass: string;
}
interface S3BucketData {
    name: string;
    delimiter: string;
    customUrl: string | null;
}
export declare class S3Bucket {
    private readonly data;
    constructor(data: S3BucketData);
    readonly name: string;
    readonly delimiter: string;
    readonly url: URL;
}
export declare class S3File extends files.BasicFile {
    private readonly bucket;
    private readonly requester;
    readonly created: Date;
    readonly extra: Object;
    readonly icon: string | null;
    readonly id: string;
    readonly lastModified: Date;
    readonly mimeType: string;
    readonly size: number;
    constructor(metadata: S3ObjectData, bucket: S3Bucket, requester?: Requester);
    readonly name: string;
    private readonly urlObject;
    readonly url: string;
    delete(): Promise<void>;
    read(): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
}
export declare class S3Directory extends files.Directory {
    private readonly bucket;
    private readonly maxKeys;
    private readonly requester;
    readonly created: Date;
    readonly extra: Object;
    readonly icon: string | null;
    readonly id: string;
    readonly lastModified: Date;
    constructor(prefix: string, bucket: S3Bucket, maxKeys: number | null, requester?: Requester);
    readonly name: string;
    addDirectory(name: string): Promise<files.Directory>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File>;
    delete(): Promise<void>;
    private getFilesForPrefix;
    getFile(pathArray: string[]): Promise<files.File>;
    getChildren(): Promise<files.File[]>;
    rename(newName: string): Promise<void>;
    search(query: string): Promise<SearchResult[]>;
}
export {};
