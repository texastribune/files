import * as files from "../files/base.js";
let idCounter = 0;
let processes = [];
export class ProcessFile extends files.BasicFile {
    constructor() {
        super();
        this.created = new Date();
        this.lastModified = new Date();
        this.extra = {};
        idCounter++;
        this.id = idCounter.toString();
        processes.push(this);
    }
    get name() {
        return this.id;
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    get size() {
        return 0;
    }
    get mimeType() {
        return 'text/plain';
    }
    async delete() {
        processes = processes.filter((file) => { return file !== this; });
    }
    read() {
        throw new Error("Cannot rename process file");
    }
    rename(newName) {
        throw new Error("Cannot rename process file");
    }
    write(data) {
        throw new Error("Cannot write to process file");
    }
}
export class ProcessDirectory extends files.Directory {
    constructor() {
        super(...arguments);
        this.created = new Date();
        this.lastModified = new Date();
        this.extra = {};
    }
    get id() {
        return 'proc';
    }
    get name() {
        return 'proc';
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    async getChildren() {
        console.log("PROC CHILD", processes.slice());
        return processes.slice();
    }
    delete() {
        throw new Error("Cannot delete process directory");
    }
    rename(newName) {
        throw new Error("Cannot rename process directory");
    }
    search(query) {
        throw new Error("Cannot search process directory");
    }
    async addFile(fileData, filename, mimeType) {
        throw new Error("Cannot add file to process directory");
    }
    async addDirectory(name) {
        throw new Error("Cannot add directory to process directory");
    }
}
