import { BasicFile } from "../files/base";
export declare class FileBrowserDevice extends BasicFile {
    constructor(directory: any, element: any, name: any);
    readonly id: any;
    readonly name: any;
    readonly mimeType: string;
    readonly size: number;
    readonly url: null;
    readonly icon: null;
    readonly created: any;
    readonly lastModified: any;
    read(params: any): Promise<string>;
    write(data: any): Promise<any>;
}
