"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const files = __importStar(require("./base.js"));
const base_1 = require("./base");
let idCounter = 0;
class MemoryFile extends files.BasicFile {
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
    onChange() {
        super.onChange();
        this.parent.onChildChange();
    }
    get url() {
        let numArray = new Uint8Array(this.fileData);
        let binaryStr = String.fromCharCode.apply(null, numArray);
        return `data:${this.mimeType};base64,${btoa(binaryStr)}`;
    }
    get size() {
        return this.fileData.byteLength;
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fileData;
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.fileData = data;
            this.lastModified = new Date();
            this.onChange();
            return data;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            this.parent.removeChild(this);
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent.nameExists(newName)) {
                throw new base_1.FileAlreadyExistsError(`name ${newName} already exists`);
            }
            this.name = newName;
            this.lastModified = new Date();
            this.onChange();
        });
    }
}
exports.MemoryFile = MemoryFile;
class MemoryDirectory extends files.Directory {
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
        this.onChange();
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent !== null) {
                this.parent.removeChild(this);
            }
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent !== null && this.parent.nameExists(newName)) {
                throw new base_1.FileAlreadyExistsError(`name ${newName} already exists`);
            }
            this.name = newName;
            this.onChange();
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.children.slice();
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            let path = this.path;
            for (let child of this.children) {
                if (child.name.includes(query)) {
                    results.push({ path: path.concat([child.name]), file: child });
                }
                if (child instanceof files.Directory) {
                    let subResults = yield child.search(query);
                    results = results.concat(subResults);
                }
            }
            return results;
        });
    }
    nameExists(name) {
        let names = this.children.reduce((names, file) => {
            names.add(file.name);
            return names;
        }, new Set());
        return names.has(name);
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.nameExists(filename)) {
                throw new base_1.FileAlreadyExistsError(`file named ${filename} already exists`);
            }
            let newFile = new MemoryFile(this, filename, mimeType, fileData);
            this.addChild(newFile);
            return newFile;
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.nameExists(name)) {
                throw new base_1.FileAlreadyExistsError(`file named ${name} already exists`);
            }
            let newDir = new MemoryDirectory(this, name);
            this.addChild(newDir);
            return newDir;
        });
    }
    addChild(memoryFile) {
        this.children.push(memoryFile);
        this.onChange();
    }
    removeChild(memoryFile) {
        this.children = this.children.filter((file) => { return file !== memoryFile; });
        this.onChange();
    }
}
exports.MemoryDirectory = MemoryDirectory;
