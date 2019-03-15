import * as files from "../files/base";
export declare class ProcessFile extends files.BasicFile {
    readonly id: string;
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    protected constructor();
    readonly name: string;
    readonly url: null;
    readonly icon: null;
    readonly size: number;
    readonly mimeType: string;
    delete(): Promise<void>;
    read(): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
}
export declare class ProcessDirectory extends files.Directory {
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    readonly id: string;
    readonly name: string;
    readonly url: null;
    readonly icon: null;
    getChildren(): Promise<ProcessFile[]>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
    search(query: string): Promise<File[]>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
}
