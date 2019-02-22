import { Directory, BasicFile } from "../files/base.js";
export declare abstract class ProcessFile extends BasicFile {
    private readonly _id;
    private readonly _created;
    private _lastModified;
    readonly extra: {};
    protected constructor();
    readonly id: string;
    readonly url: null;
    readonly icon: null;
    readonly size: number;
    readonly mimeType: string;
    readonly created: Date;
    readonly lastModified: Date;
    delete(): Promise<void>;
}
export declare abstract class ProcessDirectory extends Directory {
    private readonly _created;
    private _lastModified;
    readonly id: string;
    readonly name: string;
    readonly url: null;
    readonly icon: null;
    readonly created: Date;
    readonly lastModified: Date;
    getChildren(): Promise<ProcessFile[]>;
}
