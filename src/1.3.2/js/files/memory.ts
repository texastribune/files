import * as files from "./base.js";


let idCounter = 0;


export class MemoryFile extends files.BasicFile {
    public readonly id : string;
    public readonly created = new Date();
    public readonly icon = null;
    public readonly mimeType : string;
    public readonly extra = {};

    private parent : MemoryDirectory;
    private fileData : ArrayBuffer;
    public name : string;
    public lastModified : Date;

    constructor(parent : MemoryDirectory, name : string, mimeType? : string, data? : ArrayBuffer) {
        super();
        this.parent = parent;
        this.name = name;
        this.mimeType = mimeType || 'application/octet-stream';
        this.fileData = data || new ArrayBuffer(0);
        this.lastModified = new Date();

        idCounter ++;
        this.id = idCounter.toString();
    }

    get url(){
        let numArray = new Uint8Array(this.fileData) as unknown as number[];
        let binaryStr = String.fromCharCode.apply(null, numArray);
        return `data:${this.mimeType};base64,${btoa(binaryStr)}`;
    }

    get size(){
        return this.fileData.byteLength;
    }

    async read(params : Object){
        return this.fileData;
    }

    async write(data : ArrayBuffer){
        this.fileData = data;
        this.lastModified = new Date();
        return data;
    }

    async delete() {
        this.parent.removeChild(this);
    }

    async rename(newName : string){
        this.name = newName;
        this.lastModified = new Date();
    }
}

export class MemoryDirectory extends files.Directory {
    public readonly id : string;
    public readonly created = new Date();
    public readonly icon = null;
    public readonly extra = {};

    private readonly parent : MemoryDirectory | null;
    public name : string;
    private children : (MemoryFile | MemoryDirectory)[] = [];

    constructor(parent : MemoryDirectory | null, name : string) {
        super();

        this.parent = parent;
        this.name = name;

        idCounter ++;
        this.id = idCounter.toString();
    }

    get lastModified() : Date {
        let children = Object.values(this.children);
        if (children.length === 0){
            return this.created;
        }
        return new Date(Math.max.apply(null, Object.values(this.children).map(function(e) {
            return new Date(e.lastModified).getTime();
        })));
    }

    async delete() {
        if (this.parent !== null) {
            this.parent.removeChild(this);
        }
    }

    async rename(newName : string){
        this.name = newName;
    }

    async getChildren() : Promise<files.File[]> {
        return this.children.slice();
    }

    async search(query : string) {
        let results : files.File[] = [];
        for (let child of this.children){
            if (name === query){
                results.push(child);
            }
            if (child instanceof files.Directory){
                let subResults = await child.search(query);
                results = results.concat(subResults);
            }
        }
        return results;
    }

    private nameExists(name : string){
        let names = this.children.reduce((names, file) => {
            names.add(file.name);
            return names;
        }, new Set<string>());
        return names.has(name);
    }

    async addFile(fileData : ArrayBuffer, filename : string, mimeType : string) {
        if (this.nameExists(filename)){
            throw new Error(`name ${filename} already exists`);
        }
        let newFile = new MemoryFile(this, filename, mimeType, fileData);
        this.addChild(newFile);
        return newFile;
    }

    async addDirectory(name : string) {
        if (this.nameExists(name)){
            throw new Error(`name ${name} already exists`);
        }
        let newDir = new MemoryDirectory(this, name);
        this.addChild(newDir);
        return newDir;
    }

    addChild(memoryFile : MemoryFile | MemoryDirectory){
        this.children.push(memoryFile);
    }

    removeChild(memoryFile : MemoryFile | MemoryDirectory){
        this.children = this.children.filter((file) => {return file !== memoryFile});
    }
}