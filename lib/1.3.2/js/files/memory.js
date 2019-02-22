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
    get url() {
        let numArray = new Uint8Array(this.fileData);
        let binaryStr = String.fromCharCode.apply(null, numArray);
        return `data:${this.mimeType};base64,${btoa(binaryStr)}`;
    }
    get size() {
        return this.fileData.byteLength;
    }
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.fileData;
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.fileData = data;
            this.lastModified = new Date();
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
            this.name = newName;
            this.lastModified = new Date();
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
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent !== null) {
                this.parent.removeChild(this);
            }
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.name = newName;
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._children.slice();
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            for (let child of this._children) {
                if (name === query) {
                    results.push(child);
                }
                if (child instanceof files.Directory) {
                    let subResults = yield child.search(query);
                    results = results.concat(subResults);
                }
            }
            return results;
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            let newFile = new MemoryFile(this, filename, mimeType, fileData);
            this.addChild(newFile);
            return newFile;
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let newDir = new MemoryDirectory(this, name);
            this.addChild(newDir);
            return newDir;
        });
    }
    addChild(memoryFile) {
        this._children.push(memoryFile);
    }
    removeChild(memoryFile) {
        this._children = this._children.filter((file) => { return file !== memoryFile; });
    }
}
exports.MemoryDirectory = MemoryDirectory;
