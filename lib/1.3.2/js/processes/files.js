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
const files = __importStar(require("../files/base"));
let idCounter = 0;
let processes = [];
class ProcessFile extends files.BasicFile {
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
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("DELETE");
            console.trace();
            processes = processes.filter((file) => { return file !== this; });
        });
    }
    read(params) {
        throw new Error("Cannot rename process file");
    }
    rename(newName) {
        throw new Error("Cannot rename process file");
    }
    write(data) {
        throw new Error("Cannot write to process file");
    }
}
exports.ProcessFile = ProcessFile;
class ProcessDirectory extends files.Directory {
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
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("PROC CHILD", processes.slice());
            return processes.slice();
        });
    }
    delete() {
        throw new Error("Cannot delete process directory");
    }
    rename(newName) {
        throw new Error("Cannot rename process directory");
    }
    search(query) {
        return undefined;
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Cannot add file to process directory");
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Cannot add directory to process directory");
        });
    }
}
exports.ProcessDirectory = ProcessDirectory;
