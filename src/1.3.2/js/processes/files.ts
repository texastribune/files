import * as files from "../files/base";

let idCounter = 0;

let processes : ProcessFile[] = [];

export class ProcessFile extends files.BasicFile {
    public readonly id : string;
    public readonly created = new Date();
    public readonly lastModified = new Date();
    public readonly extra = {};

    protected constructor(){
        super();

        idCounter ++;
        this.id = idCounter.toString();

        processes.push(this);
    }

    get name(){
        return this.id;
    }

    get url(){
        return null;
    }

    get icon(){
        return null;
    }

    get size(){
        return 0;
    }

    get mimeType(){
        return 'text/plain';
    }

    async delete() {
        console.log("DELETE");
        console.trace();
        processes = processes.filter((file) => {return file !== this});
    }

    read(): Promise<ArrayBuffer> {
        throw new Error("Cannot rename process file");
    }

    rename(newName: string): Promise<void> {
        throw new Error("Cannot rename process file");
    }

    write(data: ArrayBuffer): Promise<ArrayBuffer> {
        throw new Error("Cannot write to process file");
    }
}

export class ProcessDirectory extends files.Directory {
    public readonly created = new Date();
    public readonly lastModified = new Date();
    public readonly extra = {};

    get id(){
        return 'proc';
    }

    get name(){
        return 'proc';
    }

    get url(){
        return null;
    }

    get icon() {
        return null;
    }

    async getChildren(){
        console.log("PROC CHILD", processes.slice());
        return processes.slice();
    }

    delete(): Promise<void> {
        throw new Error("Cannot delete process directory");
    }

    rename(newName: string): Promise<void> {
        throw new Error("Cannot rename process directory");
    }

    search(query: string): Promise<File[]> {
        return undefined;
    }

    async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File> {
        throw new Error("Cannot add file to process directory");
    }

    async addDirectory(name: string): Promise<files.Directory> {
        throw new Error("Cannot add directory to process directory");
    }
}