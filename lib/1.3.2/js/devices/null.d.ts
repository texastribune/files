import { BasicFile } from "../files/base";
export declare class NullFile extends BasicFile {
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
    read(params?: Object): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
}
