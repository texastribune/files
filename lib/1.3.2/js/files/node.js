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
const files = __importStar(require("./base"));
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
/**
 * A file on the local system using NodeJS file operations.
 */
class NodeFile extends files.BasicFile {
    constructor(path, stat) {
        super();
        this.extra = {};
        this.path = path;
        this.stat = stat || fs_1.statSync(path);
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
            yield fs_2.promises.rename(this.id, newPath);
            this.path = newPath;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs_2.promises.unlink(this.id);
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let typedArray = yield fs_2.promises.readFile(this.id);
            return typedArray.buffer;
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs_2.promises.writeFile(this.id, new Buffer.from(data));
            return yield fs_2.promises.readFile(this.id);
        });
    }
}
exports.NodeFile = NodeFile;
class NodeDirectory extends files.Directory {
    constructor(path, stat) {
        super();
        this.extra = {};
        this.path = path;
        this.stat = stat || fs_1.statSync(path);
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
            yield fs_2.promises.rename(this.id, newPath);
            this.path = newPath;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs_2.promises.unlink(this.id);
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(fileData instanceof ArrayBuffer)) {
                throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`);
            }
            let filePath = path.join(this.id, filename);
            yield fs_2.promises.appendFile(filePath, new Buffer.from(fileData));
            let stat = yield fs_2.promises.stat(filePath);
            return new NodeFile(filePath, stat);
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let dirPath = path.join(this.id, name);
            yield fs_2.promises.mkdir(dirPath, null);
            let stat = yield fs_2.promises.stat(dirPath);
            return new NodeDirectory(dirPath, stat);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            let nameArray = yield fs_2.promises.readdir(this.id);
            for (let name of nameArray) {
                let childPath = path.join(this.id, name);
                let stat = yield fs_2.promises.stat(childPath);
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
exports.NodeDirectory = NodeDirectory;
