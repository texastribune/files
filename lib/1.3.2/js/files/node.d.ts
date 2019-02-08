import { BasicFile } from "./base";
declare class AbstractNodeFileBase extends BasicFile {
    constructor(path: any, stat: any);
    static readonly preservesMimeType: boolean;
    readonly id: any;
    readonly name: string;
    readonly url: null;
    readonly icon: null;
    readonly size: any;
    readonly lastModified: any;
    readonly created: any;
    rename(newName: any): Promise<void>;
    delete(): Promise<void>;
    copy(targetParentId: any): Promise<void>;
    move(targetParentId: any): Promise<void>;
    search(query: any): Promise<void>;
}
/**
 * A file on the local system using NodeJS file operations.
 */
export declare class NodeFile extends AbstractNodeFileBase {
    readonly mimeType: string;
    read(params: any): Promise<any>;
    write(data: any): Promise<any>;
}
declare const NodeDirectory_base: any;
export declare class NodeDirectory extends NodeDirectory_base {
    addFile(fileData: any, filename: any, type: any): Promise<NodeFile>;
    addDirectory(name: any): Promise<any>;
    getChildren(): Promise<any[]>;
}
export {};
