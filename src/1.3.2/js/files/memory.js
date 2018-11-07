import {AbstractDirectory, AbstractFile, DirectoryMixin} from "./base";


let idCounter = 0;


export class MemoryFile extends AbstractFile {
    constructor(parent, name, mimeType, data) {
        if (data && !(data instanceof ArrayBuffer)){
            throw new Error("File data must be an instance of ArrayBuffer");
        }
        super(parent, name);
        this._parent = parent;
        this._name = name;
        this._mimeType = mimeType || 'application/octet-stream';
        this._fileData = data;
        this._lastModified = new Date();
        this._created = new Date();

        idCounter ++;
        this._id = idCounter;
    }

    get id(){
        return this._id;
    }

    get name(){
        return this._name;
    }

    get icon(){
        return null;
    }

    get url(){
        return null;
    }

    get mimeType(){
        return this._mimeType;
    }

    get size(){
        return this._fileData.byteLength;
    }

    get lastModified(){
        return this._lastModified;
    }

    get created(){
        return this._created;
    }

    async read(params){
        return this._fileData;
    }

    async write(data){
        this._fileData = data;
        return data;
    }

    async delete() {
        this._parent.removeChild(this);
    }

    async rename(newName){
        this._name = newName;
    }
}

export class MemoryDirectory extends DirectoryMixin(MemoryFile) {
    constructor(parent, name) {
        super(parent, name, null, null);
        this._children = [];
    }

    get lastModified(){
        let children = Object.values(this._children);
        if (children.length === 0){
            return this.created;
        }
        return new Date(Math.max.apply(null, Object.values(this._children).map(function(e) {
            return new Date(e.lastModified);
        })));
    }

    async getChildren(){
        return this._children;
    }

    async search(query) {
        super.search(query);
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

    addChild(memoryFile){
        this._children.push(memoryFile);
    }

    removeChild(memoryFile){
        this._children = this._children.filter((file) => {return file !== memoryFile});
    }
}