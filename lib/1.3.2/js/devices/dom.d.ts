import * as files from "../files/base";
export declare abstract class AbstractElementFile extends files.BasicFile {
    readonly created: Date;
    readonly extra: {};
    lastModified: Date;
    protected readonly element: HTMLElement;
    constructor(element: HTMLElement);
    readonly id: string;
    readonly icon: string | null;
    readonly url: string | null;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
}
export declare class DomElementDevice extends files.Directory {
    private readonly element;
    readonly created: Date;
    readonly lastModified: Date;
    readonly extra: {};
    private readonly keyboard;
    private readonly mouse;
    private readonly text;
    private readonly class;
    constructor(element: HTMLElement);
    readonly id: string;
    readonly name: string;
    readonly size: number;
    readonly icon: null;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getChildren(): Promise<files.File[]>;
    delete(): Promise<void>;
    rename(newName: string): Promise<void>;
    search(query: string): Promise<files.File[]>;
}
