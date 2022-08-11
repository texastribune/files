import { BasicFile } from "../files/base.js";
export declare class NullFile extends BasicFile {
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    constructor();
    get id(): string;
    get name(): string;
    get icon(): null;
    get url(): null;
    get mimeType(): string;
    get size(): number;
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
}
