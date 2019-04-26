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
/**
 * Proxy to a file
 */
class ProxyFile extends files.BasicFile {
    constructor(concreteFile) {
        super();
        this.concreteFile = concreteFile;
        this.concreteFile.addOnChangeListener(() => {
            this.dispatchChangeEvent();
        });
    }
    get id() {
        return this.concreteFile.id;
    }
    get name() {
        return this.concreteFile.name;
    }
    get directory() {
        return this.concreteFile.directory;
    }
    get url() {
        return this.concreteFile.url;
    }
    get icon() {
        return this.concreteFile.icon;
    }
    get size() {
        return this.concreteFile.size;
    }
    get mimeType() {
        return this.concreteFile.mimeType;
    }
    get lastModified() {
        return this.concreteFile.lastModified;
    }
    get created() {
        return this.concreteFile.created;
    }
    get extra() {
        return this.concreteFile.extra;
    }
    read() {
        return this.concreteFile.read();
    }
    write(data) {
        return this.concreteFile.write(data);
    }
    rename(newName) {
        return this.concreteFile.rename(newName);
    }
    delete() {
        return this.concreteFile.delete();
    }
    copy(targetDirectory) {
        return this.concreteFile.copy(targetDirectory);
    }
    ;
    move(targetDirectory) {
        return this.concreteFile.move(targetDirectory);
    }
}
exports.ProxyFile = ProxyFile;
/**
 * Proxy to a directory
 * @property {Directory} concreteDirectory - The directory to proxy
 */
class ProxyDirectory extends files.Directory {
    constructor(concreteDirectory) {
        super();
        this.concreteDirectory = concreteDirectory;
        this.concreteDirectory.addOnChangeListener(() => {
            this.dispatchChangeEvent();
        });
    }
    get id() {
        return this.concreteDirectory.id;
    }
    get name() {
        return this.concreteDirectory.name;
    }
    get directory() {
        return this.concreteDirectory.directory;
    }
    get url() {
        return this.concreteDirectory.url;
    }
    get icon() {
        return this.concreteDirectory.icon;
    }
    get lastModified() {
        return this.concreteDirectory.lastModified;
    }
    get created() {
        return this.concreteDirectory.created;
    }
    get extra() {
        return this.concreteDirectory.extra;
    }
    rename(newName) {
        return this.concreteDirectory.rename(newName);
    }
    delete() {
        return this.concreteDirectory.delete();
    }
    search(query) {
        return this.concreteDirectory.search(query);
    }
    addFile(fileData, filename, mimeType) {
        return this.concreteDirectory.addFile(fileData, filename, mimeType);
    }
    addDirectory(name) {
        return this.concreteDirectory.addDirectory(name);
    }
    getChildren() {
        return this.concreteDirectory.getChildren();
    }
}
exports.ProxyDirectory = ProxyDirectory;
/**
 * Fires change event for local file changes such as write, rename, delete, etc.
 */
class ChangeEventProxyFile extends ProxyFile {
    write(data) {
        const _super = Object.create(null, {
            write: { get: () => super.write }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.write.call(this, data);
            this.dispatchChangeEvent();
            return ret;
        });
    }
    rename(newName) {
        const _super = Object.create(null, {
            rename: { get: () => super.rename }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.rename.call(this, newName);
            this.dispatchChangeEvent();
            return ret;
        });
    }
    delete() {
        const _super = Object.create(null, {
            delete: { get: () => super.delete }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.delete.call(this);
            this.dispatchChangeEvent();
        });
    }
}
exports.ChangeEventProxyFile = ChangeEventProxyFile;
/**
 * Fires change event for local file changes such as rename, delete, etc. as well as
 * when those changes happen on children of the directory.
 */
class ChangeEventProxyDirectory extends ProxyDirectory {
    rename(newName) {
        const _super = Object.create(null, {
            rename: { get: () => super.rename }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.rename.call(this, newName);
            this.dispatchChangeEvent();
            return ret;
        });
    }
    delete() {
        const _super = Object.create(null, {
            delete: { get: () => super.delete }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.delete.call(this);
            this.dispatchChangeEvent();
        });
    }
    addFile(fileData, filename, mimeType) {
        const _super = Object.create(null, {
            addFile: { get: () => super.addFile }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.addFile.call(this, fileData, filename, mimeType);
            this.dispatchChangeEvent();
            return ret;
        });
    }
    addDirectory(name) {
        const _super = Object.create(null, {
            addDirectory: { get: () => super.addDirectory }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.addDirectory.call(this, name);
            this.dispatchChangeEvent();
            return ret;
        });
    }
    createChild(child) {
        if (child instanceof files.Directory) {
            return new ChangeEventProxyDirectory(child);
        }
        else {
            return new ChangeEventProxyFile(child);
        }
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            for (let child of yield _super.getChildren.call(this)) {
                child = this.createChild(child);
                child.addOnChangeListener(() => {
                    this.dispatchChangeEvent();
                });
                children.push(child);
            }
            return children;
        });
    }
}
exports.ChangeEventProxyDirectory = ChangeEventProxyDirectory;
/**
 * Caches the children of the directory for when getChildren is called. Listens for change events
 * to invalidate the cache.
 */
class CachedProxyDirectory extends ChangeEventProxyDirectory {
    constructor(concreteDirectory, parentDirectory) {
        super(concreteDirectory);
        this.cachedChildren = null;
        this.parent = parentDirectory || null;
    }
    dispatchChangeEvent() {
        this.clearCache();
        super.dispatchChangeEvent();
    }
    get root() {
        if (this.parent === null) {
            return this;
        }
        return this.parent.root;
    }
    get path() {
        if (this.parent === null) {
            return [this];
        }
        return this.parent.path.concat([this]);
    }
    createChild(child) {
        if (child instanceof files.Directory) {
            return new CachedProxyDirectory(child, this);
        }
        else {
            return new ChangeEventProxyFile(child);
        }
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cachedChildren === null) {
                this.cachedChildren = yield _super.getChildren.call(this);
            }
            return this.cachedChildren.slice();
        });
    }
    clearCache() {
        this.cachedChildren = null;
    }
}
exports.CachedProxyDirectory = CachedProxyDirectory;