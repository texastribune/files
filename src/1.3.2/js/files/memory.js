import {AbstractDirectory, AbstractFile} from "./base";


let idCounter = 0;

export class MemoryFile extends AbstractFile {
    constructor(parent, name, mimeType, data) {
        super();
        this._parent = parent;
        this._name = name;
        this._mimeType = mimeType;
        this._fileData = data;
        this._created = new Date();
        this._lastModified = new Date();

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

    get mimeType(){
        return this._mimeType;
    }

    get size(){
        return this._fileData.byteLength;
    }

    async getParent(){
        return this._parent;
    }

    set parent(parent){
        if (this._parent){
            this._parent.removeChild(this.name);
        }
        if (parent !== null){
            parent.addChild(this);
        }
        this._parent = parent
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
        let parent = await this.getParent();
        parent.removeChild(this);
    }

    async rename(newName){
        this._name = newName;
    }
}

export class MemoryDirectory extends AbstractDirectory {
    constructor(parent, name) {
        super();
        this._parent = parent;
        this._name = name;
        this._children = [];
        this._created = new Date();

        idCounter ++;
        this._id = idCounter;
    }

    async getParent(){
        return this._parent;
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

    get lastModified(){
        let children = Object.values(this._children);
        if (children.length === 0){
            return this.created;
        }
        return new Date(Math.max.apply(null, Object.values(this._children).map(function(e) {
            return new Date(e.lastModified);
        })));
    }

    get created(){
        return this._created;
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

    async delete() {
        let parent = await this.getParent();
        parent.removeChild(this);
    }

    async rename(newName){
        this._name = newName;
    }

    addChild(memoryFile){
        this._children.push(memoryFile);
    }

    removeChild(memoryFile){
        this._children = this._children.filter((file) => {return file !== memoryFile});
    }
}