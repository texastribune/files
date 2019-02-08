import * as files from "../files/base";
export declare class DeviceDirectory extends files.Directory {
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    private readonly extraChildren;
    constructor();
    readonly name: string;
    readonly id: string;
    readonly icon: null;
    getChildren(): Promise<files.File[]>;
    addDirectory(name: string): Promise<files.Directory>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
    search(query: string): Promise<files.File[]>;
}
