import * as files from "../files/base.js";
export declare class ConsoleFile extends files.BasicFile {
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    constructor();
    readonly id: string;
    readonly name: string;
    readonly icon: null;
    readonly url: null;
    readonly mimeType: string;
    readonly size: number;
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
}
