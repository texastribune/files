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
 * Proxy to an file
 */
class ProxyFile extends files.BasicFile {
    constructor(concreteFile) {
        super();
        this.concreteFile = concreteFile;
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
    addOnChangeListener(listener) {
        this.concreteFile.addOnChangeListener(listener);
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
}
exports.ProxyFile = ProxyFile;
/**
 * Proxy to an file
 * @property {Directory} concreteDirectory - The directory to proxy
 */
class ProxyDirectory extends files.Directory {
    constructor(concreteDirectory) {
        super();
        this.concreteDirectory = concreteDirectory;
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
    onChange() {
        this.concreteDirectory.onChange();
    }
    addOnChangeListener(listener) {
        this.concreteDirectory.addOnChangeListener(listener);
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
class ChangeEventProxyFile extends ProxyFile {
    write(data) {
        const _super = Object.create(null, {
            write: { get: () => super.write }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.write.call(this, data);
            this.onChange();
            return ret;
        });
    }
    rename(newName) {
        const _super = Object.create(null, {
            rename: { get: () => super.rename }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.rename.call(this, newName);
            this.onChange();
            return ret;
        });
    }
    delete() {
        const _super = Object.create(null, {
            delete: { get: () => super.delete }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.delete.call(this);
            this.onChange();
        });
    }
}
exports.ChangeEventProxyFile = ChangeEventProxyFile;
class ChangeEventProxyDirectory extends ProxyDirectory {
    rename(newName) {
        const _super = Object.create(null, {
            rename: { get: () => super.rename }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield _super.rename.call(this, newName);
            this.onChange();
            return ret;
        });
    }
    delete() {
        const _super = Object.create(null, {
            delete: { get: () => super.delete }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.delete.call(this);
            this.onChange();
        });
    }
    addFile(fileData, filename, mimeType) {
        const _super = Object.create(null, {
            addFile: { get: () => super.addFile }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = _super.addFile.call(this, fileData, filename, mimeType);
            this.onChange();
            return ret;
        });
    }
    addDirectory(name) {
        const _super = Object.create(null, {
            addDirectory: { get: () => super.addDirectory }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let ret = _super.addDirectory.call(this, name);
            this.onChange();
            return ret;
        });
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            for (let child of yield _super.getChildren.call(this)) {
                if (child instanceof files.Directory) {
                    child = new ChangeEventProxyDirectory(child);
                }
                else {
                    child = new ChangeEventProxyFile(child);
                }
                child.addOnChangeListener(() => {
                    this.onChange();
                });
                children.push(child);
            }
            return children;
        });
    }
}
exports.ChangeEventProxyDirectory = ChangeEventProxyDirectory;
class CachedProxyDirectory extends ChangeEventProxyDirectory {
    constructor(concreteDirectory, parentDirectory) {
        super(concreteDirectory);
        this.cachedChildren = null;
        this.parent = parentDirectory || null;
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
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cachedChildren === null) {
                let newChildren = [];
                for (let child of yield _super.getChildren.call(this)) {
                    if (child instanceof files.Directory) {
                        child = new CachedProxyDirectory(child, this);
                    }
                    newChildren.push(child);
                }
                this.cachedChildren = newChildren;
            }
            return this.cachedChildren.slice();
        });
    }
    clearCache() {
        this.cachedChildren = null;
    }
}
exports.CachedProxyDirectory = CachedProxyDirectory;
