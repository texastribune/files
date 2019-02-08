import * as files from "./base.js";
let idCounter = 0;
export class MemoryFile extends files.BasicFile {
    constructor(parent, name, mimeType, data) {
        super();
        this.created = new Date();
        this.icon = null;
        this.url = null;
        this.extra = {};
        this.parent = parent;
        this.name = name;
        this.mimeType = mimeType || 'application/octet-stream';
        this.fileData = data || new ArrayBuffer(0);
        this.lastModified = new Date();
        idCounter++;
        this.id = idCounter.toString();
    }
    get size() {
        return this.fileData.byteLength;
    }
    async read(params) {
        return this.fileData;
    }
    async write(data) {
        this.fileData = data;
        this.lastModified = new Date();
        return data;
    }
    async delete() {
        this.parent.removeChild(this);
    }
    async rename(newName) {
        this.name = newName;
        this.lastModified = new Date();
    }
}
export class MemoryDirectory extends files.Directory {
    constructor(parent, name) {
        super();
        this.created = new Date();
        this.icon = null;
        this.extra = {};
        this._children = [];
        this.parent = parent;
        this.name = name;
        idCounter++;
        this.id = idCounter.toString();
    }
    get lastModified() {
        let children = Object.values(this._children);
        if (children.length === 0) {
            return this.created;
        }
        return new Date(Math.max.apply(null, Object.values(this._children).map(function (e) {
            return new Date(e.lastModified).getTime();
        })));
    }
    async delete() {
        if (this.parent !== null) {
            this.parent.removeChild(this);
        }
    }
    async rename(newName) {
        this.name = newName;
    }
    async getChildren() {
        return this._children.slice();
    }
    async search(query) {
        let results = [];
        for (let child of this._children) {
            if (name === query) {
                results.push(child);
            }
            if (child instanceof files.Directory) {
                let subResults = await child.search(query);
                results = results.concat(subResults);
            }
        }
        return results;
    }
    async addFile(fileData, filename, mimeType) {
        let newFile = new MemoryFile(this, filename, mimeType, fileData);
        this.addChild(newFile);
        return newFile;
    }
    async addDirectory(name) {
        let newDir = new MemoryDirectory(this, name);
        this.addChild(newDir);
        return newDir;
    }
    addChild(memoryFile) {
        this._children.push(memoryFile);
    }
    removeChild(memoryFile) {
        this._children = this._children.filter((file) => { return file !== memoryFile; });
    }
}
