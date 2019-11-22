var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "./base.js";
import { statSync, watch, existsSync } from "fs";
import { promises as fs } from "fs";
import * as path from 'path';
import { FileAlreadyExistsError } from "./base.js";
/**
 * A file on the local system using NodeJS file operations.
 */
export class NodeFile extends files.BasicFile {
    constructor(path, stat) {
        super();
        this.extra = {};
        this.path = path;
        this.stat = stat || statSync(path);
        this.watcher = watch(this.path, () => {
            this.dispatchChangeEvent();
        });
    }
    get id() {
        return this.path;
    }
    get name() {
        return path.basename(this.path);
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    get size() {
        return this.stat.size;
    }
    get lastModified() {
        return this.stat.birthtime;
    }
    get created() {
        return this.stat.ctime;
    }
    get mimeType() {
        return 'application/octet-stream';
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let dirName = path.dirname(this.id);
            let newPath = path.join(dirName, newName);
            yield fs.rename(this.id, newPath);
            this.path = newPath;
            this.watcher.close();
            this.watcher = watch(this.path, () => {
                this.dispatchChangeEvent();
            });
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            this.watcher.close();
            yield fs.unlink(this.id);
        });
    }
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            let typedArray = yield fs.readFile(this.id);
            return typedArray.buffer.slice(typedArray.byteOffset, typedArray.byteLength + typedArray.byteOffset);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.writeFile(this.id, Buffer.from(data));
            return yield fs.readFile(this.id);
        });
    }
}
export class NodeDirectory extends files.Directory {
    constructor(path, stat) {
        super();
        this.extra = {};
        this.path = path;
        this.stat = stat || statSync(path);
        this.watcher = watch(this.path, { recursive: true }, () => {
            this.dispatchChangeEvent();
        });
    }
    get id() {
        return this.path;
    }
    get name() {
        return path.basename(this.path);
    }
    get icon() {
        return null;
    }
    get lastModified() {
        return this.stat.birthtime;
    }
    get created() {
        return this.stat.ctime;
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let dirName = path.dirname(this.id);
            let newPath = path.join(dirName, newName);
            yield fs.rename(this.id, newPath);
            this.path = newPath;
            this.watcher.close();
            this.watcher = watch(this.path, { recursive: true }, () => {
                this.dispatchChangeEvent();
            });
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            this.watcher.close();
            for (let child of yield this.getChildren()) {
                yield child.delete();
            }
            yield fs.rmdir(this.id);
        });
    }
    searchDir(id, query) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            let nameArray = yield fs.readdir(id);
            for (let childName of nameArray) {
                let childId = path.join(id, childName);
                try {
                    let stat = yield fs.stat(childId);
                    let isDir = stat.isDirectory();
                    if (childName.includes(query)) {
                        results.push({ path: [childName,], id: childId, stat: stat });
                    }
                    if (isDir) {
                        let subResults = yield this.searchDir(childId, query);
                        for (let result of subResults) {
                            result.path.unshift(childName);
                        }
                        results = results.concat(subResults);
                    }
                }
                catch (e) {
                    // File possible not found. Could have been removed concurrently.
                }
            }
            return results;
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            let statResults = yield this.searchDir(this.id, query);
            for (let result of statResults) {
                if (result.stat.isDirectory()) {
                    results.push({
                        path: result.path,
                        file: new NodeDirectory(result.id, result.stat),
                    });
                }
                else {
                    results.push({
                        path: result.path,
                        file: new NodeFile(result.id, result.stat),
                    });
                }
            }
            return results;
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(fileData instanceof ArrayBuffer)) {
                throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`);
            }
            let filePath = path.join(this.id, filename);
            if (existsSync(filePath)) {
                throw new FileAlreadyExistsError(`file named ${name} already exists`);
            }
            yield fs.appendFile(filePath, Buffer.from(fileData));
            let stat = yield fs.stat(filePath);
            return new NodeFile(filePath, stat);
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let dirPath = path.join(this.id, name);
            if (existsSync(dirPath)) {
                throw new FileAlreadyExistsError(`file named ${name} already exists`);
            }
            yield fs.mkdir(dirPath, null);
            let stat = yield fs.stat(dirPath);
            return new NodeDirectory(dirPath, stat);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            let nameArray = yield fs.readdir(this.id);
            for (let name of nameArray) {
                let childPath = path.join(this.id, name);
                let stat = yield fs.stat(childPath);
                if (stat.isDirectory()) {
                    children.push(new NodeDirectory(childPath, stat));
                }
                else {
                    children.push(new NodeFile(childPath, stat));
                }
            }
            return children;
        });
    }
}
