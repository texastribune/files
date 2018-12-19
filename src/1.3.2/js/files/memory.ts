import * as files from "./base";
import {Directory, isDirectory} from "./base";


let idCounter = 0;


export class MemoryFile extends files.BasicFile {
    public readonly id : string;
    public readonly created = new Date();
    public readonly icon = null;
    public readonly mimeType : string;
    public readonly url = null;
    public readonly extra = {};

    private _parent : MemoryDirectory;
    private _name : string;
    private _fileData : ArrayBuffer;
    private _lastModified : Date;

    constructor(parent : MemoryDirectory, name : string, mimeType? : string, data? : ArrayBuffer) {
        super();
        this._parent = parent;
        this._name = name;
        this.mimeType = mimeType || 'application/octet-stream';
        this._fileData = data || new ArrayBuffer(0);
        this._lastModified = new Date();

        idCounter ++;
        this.id = idCounter.toString();
    }

    get name(){
        return this._name;
    }

    get size(){
        return this._fileData.byteLength;
    }

    get lastModified(){
        return this._lastModified;
    }

    async read(params : Object){
        return this._fileData;
    }

    async write(data : ArrayBuffer){
        this._fileData = data;
        this._lastModified = new Date();
        return data;
    }

    async delete() {
        this._parent.removeChild(this);
    }

    async rename(newName : string){
        this._name = newName;
        this._lastModified = new Date();
    }
}

export class MemoryDirectory extends Directory {
    public readonly id : string;
    public readonly created = new Date();
    public readonly icon = null;
    public readonly url = null;
    public readonly extra = {};

    private _parent : MemoryDirectory;
    private _name : string;
    private _lastModified : Date;
    private _children : (MemoryFile | MemoryDirectory)[] = [];

    constructor(parent : MemoryDirectory, name : string) {
        super();

        this._parent = parent;
        this._name = name;
        this._lastModified = new Date();

        idCounter ++;
        this.id = idCounter.toString();
    }

    get name(){
        return this._name;
    }

    get lastModified() : Date {
        let children = Object.values(this._children);
        if (children.length === 0){
            return this.created;
        }
        return new Date(Math.max.apply(null, Object.values(this._children).map(function(e) {
            return new Date(e.lastModified).getTime();
        })));
    }

    async delete() {
        this._parent.removeChild(this);
    }

    async rename(newName : string){
        this._name = newName;
    }

    async getChildren(){
        return this._children.slice();
    }

    async search(query : string) {
        let results : files.File[] = [];
        for (let child of this._children){
            if (name === query){
                results.push(child);
            }
            if (child instanceof Directory){
                let subResults = await child.search(query);
                results = results.concat(subResults);
            }
        }
        return results;
    }

    async addFile(fileData : ArrayBuffer, filename : string, mimeType : string) {
        let newFile = new MemoryFile(this, filename, mimeType, fileData);
        this.addChild(newFile);
        return newFile;
    }

    async addDirectory(name : string) {
        let newDir = new MemoryDirectory(this, name);
        this.addChild(newDir);
        return newDir;
    }

    addChild(memoryFile : MemoryFile | MemoryDirectory){
        this._children.push(memoryFile);
    }

    removeChild(memoryFile : MemoryFile | MemoryDirectory){
        this._children = this._children.filter((file) => {return file !== memoryFile});
    }
}