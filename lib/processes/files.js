var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "../files/base";
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
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            processes = processes.filter((file) => { return file !== this; });
        });
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
        throw new Error("Cannot search process directory");
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
