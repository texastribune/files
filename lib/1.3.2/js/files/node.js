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
const base_1 = require("./base");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function nodeFSFuncAsyncWrapper(func) {
    return (...args) => __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve, reject) => {
            let callback = (err, stats) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(stats);
                }
            };
            args.push(callback);
            func(...args);
        });
    });
}
class AbstractNodeFileBase extends base_1.BasicFile {
    constructor(path, stat) {
        super();
        this._path = path;
        this._stat = stat || fs.statSync(path);
        this.stat = nodeFSFuncAsyncWrapper(fs.stat);
        this.readFile = nodeFSFuncAsyncWrapper(fs.readFile);
        this.writeFile = nodeFSFuncAsyncWrapper(fs.writeFile);
        this.readdir = nodeFSFuncAsyncWrapper(fs.readdir);
        this.appendFile = nodeFSFuncAsyncWrapper(fs.appendFile);
        this.mkdir = nodeFSFuncAsyncWrapper(fs.mkdir);
        this.fsrename = nodeFSFuncAsyncWrapper(fs.rename);
        this.unlink = nodeFSFuncAsyncWrapper(fs.unlink);
    }
    static get preservesMimeType() {
        return false;
    }
    get id() {
        return this._path;
    }
    get name() {
        return path.basename(this._path);
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    get size() {
        return this._stat.size;
    }
    get lastModified() {
        return this._stat.birthtime;
    }
    get created() {
        return this._stat.ctime;
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let dirName = path.dirname(this.id);
            let newPath = path.join(dirName, newName);
            yield this.fsrename(this.id, newPath);
            this._path = newPath;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unlink(this.id);
        });
    }
    copy(targetParentId) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    move(targetParentId) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
}
/**
 * A file on the local system using NodeJS file operations.
 */
class NodeFile extends AbstractNodeFileBase {
    get mimeType() {
        return 'application/octet-stream';
    }
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let typedArray = yield this.readFile(this.id);
            return typedArray.buffer;
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.writeFile(this.id, new Buffer.from(data));
            return yield this.readFile(this.id);
        });
    }
}
exports.NodeFile = NodeFile;
class NodeDirectory extends base_1.DirectoryMixin(NodeFile) {
    addFile(fileData, filename, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(fileData instanceof ArrayBuffer)) {
                throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`);
            }
            let filePath = path.join(this.id, filename);
            yield this.appendFile(filePath, new Buffer.from(fileData));
            let stat = yield this.stat(filePath);
            return new NodeFile(filePath, stat);
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let dirPath = path.join(this.id, name);
            yield this.mkdir(dirPath, null);
            let stat = yield this.stat(dirPath);
            return new NodeDirectory(dirPath, stat);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            let nameArray = yield this.readdir(this.id);
            for (let name of nameArray) {
                let childPath = path.join(this.id, name);
                let stat = yield this.stat(childPath);
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
