var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "./base.js";
import { FileAlreadyExistsError } from "./base.js";
import { arrayBufferToDataUrl } from "../utils.js";
let idCounter = 0;
export class MemoryFile extends files.BasicFile {
    constructor(parent, name, mimeType, data) {
        super();
        this.created = new Date();
        this.icon = null;
        this.extra = {};
        this.parent = parent;
        this.name = name;
        this.mimeType = mimeType || 'application/octet-stream';
        this.fileData = data || new ArrayBuffer(0);
        this.lastModified = new Date();
        idCounter++;
        this.id = idCounter.toString();
    }
    dispatchChangeEvent() {
        super.dispatchChangeEvent();
        this.parent.onChildChange();
    }
    get url() {
        return arrayBufferToDataUrl(this.fileData, this.mimeType);
    }
    get size() {
        return this.fileData.byteLength;
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.readSync();
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.writeSync(data);
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            this.deleteSync();
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.renameSync(newName);
        });
    }
    // Synchronous methods
    readSync() {
        return this.fileData;
    }
    writeSync(data) {
        this.fileData = data;
        this.lastModified = new Date();
        this.dispatchChangeEvent();
        return data;
    }
    deleteSync() {
        this.parent.removeChild(this);
    }
    renameSync(newName) {
        if (this.parent.nameExists(newName)) {
            throw new FileAlreadyExistsError(`name ${newName} already exists`);
        }
        this.name = newName;
        this.lastModified = new Date();
        this.dispatchChangeEvent();
    }
}
export class MemoryDirectory extends files.Directory {
    constructor(parent, name) {
        super();
        this.created = new Date();
        this.icon = null;
        this.extra = {};
        this.children = [];
        this.parent = parent;
        this.name = name;
        idCounter++;
        this.id = idCounter.toString();
    }
    get lastModified() {
        let children = Object.values(this.children);
        if (children.length === 0) {
            return this.created;
        }
        return new Date(Math.max.apply(null, Object.values(this.children).map(function (e) {
            return new Date(e.lastModified).getTime();
        })));
    }
    get path() {
        if (this.parent === null) {
            return [this.name];
        }
        return this.parent.path.concat([this.name]);
    }
    /**
     * Register change on parent when child changes.
     */
    onChildChange() {
        this.dispatchChangeEvent();
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            this.deleteSync();
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.renameSync(newName);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getChildrenSync();
        });
    }
    search(query) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(this.searchSync(query));
            }, 1000);
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addFileSync(fileData, filename, mimeType);
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.addDirectorySync(name);
        });
    }
    // Synchronous methods
    renameSync(newName) {
        if (this.parent !== null && this.parent.nameExists(newName)) {
            throw new FileAlreadyExistsError(`name ${newName} already exists`);
        }
        this.name = newName;
        this.dispatchChangeEvent();
    }
    deleteSync() {
        if (this.parent !== null) {
            this.parent.removeChild(this);
        }
    }
    searchSync(query) {
        let results = [];
        for (let child of this.children) {
            if (child.name.includes(query)) {
                results.push({ path: [child.name,], file: child });
            }
            if (child instanceof files.Directory) {
                let subResults = child.searchSync(query);
                for (let result of subResults) {
                    result.path.unshift(child.name);
                }
                results = results.concat(subResults);
            }
        }
        return results;
    }
    getChildrenSync() {
        return this.children.slice();
    }
    addFileSync(fileData, filename, mimeType) {
        if (this.nameExists(filename)) {
            throw new FileAlreadyExistsError(`file named ${filename} already exists`);
        }
        let newFile = new MemoryFile(this, filename, mimeType, fileData);
        this.addChild(newFile);
        return newFile;
    }
    addDirectorySync(name) {
        if (this.nameExists(name)) {
            throw new FileAlreadyExistsError(`file named ${name} already exists`);
        }
        let newDir = new MemoryDirectory(this, name);
        this.addChild(newDir);
        return newDir;
    }
    // utilities
    addChild(memoryFile) {
        this.children.push(memoryFile);
        this.dispatchChangeEvent();
    }
    removeChild(memoryFile) {
        this.children = this.children.filter((file) => { return file !== memoryFile; });
        this.dispatchChangeEvent();
    }
    nameExists(name) {
        let names = this.children.reduce((names, file) => {
            names.add(file.name);
            return names;
        }, new Set());
        return names.has(name);
    }
}
