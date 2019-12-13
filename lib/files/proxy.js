var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "./base.js";
/**
 * Proxy to a file
 */
export class ProxyFile extends files.BasicFile {
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
/**
 * Proxy to a directory
 * @property {Directory} concreteDirectory - The directory to proxy
 */
export class ProxyDirectory extends files.Directory {
    constructor(concreteDirectory) {
        super();
        this.concreteDirectory = concreteDirectory;
        this.concreteDirectory.addOnChangeListener(this.dispatchChangeEvent);
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
    copy(targetDirectory) {
        return this.concreteDirectory.copy(targetDirectory);
    }
    ;
    move(targetDirectory) {
        return this.concreteDirectory.move(targetDirectory);
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
    getFile(pathArray) {
        return this.concreteDirectory.getFile(pathArray);
    }
    getChildren() {
        return this.concreteDirectory.getChildren();
    }
}
/**
 * Fires change event for local file changes such as write, rename, delete, etc.
 */
export class ChangeEventProxyFile extends ProxyFile {
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
            let ret = yield _super.delete.call(this);
            this.dispatchChangeEvent();
            return ret;
        });
    }
}
/**
 * Caches the children of the directory for when getChildren is called. Listens for change events
 * to invalidate the cache.
 */
export class CachedProxyDirectoryBase extends ProxyDirectory {
    constructor(concreteDirectory, parentPath, rootDirectory) {
        super(concreteDirectory);
        this.pathCache = {};
        this.childCache = null;
        this.cachedRoot = rootDirectory;
        this.parentPath = parentPath;
        if (this.cachedRoot !== null) {
            this.cachedRoot.add(this.parentPath.concat([this.name]), this);
        }
        this.addOnChangeListener(this.clearCache);
    }
    get root() {
        if (this.cachedRoot === null) {
            return this;
        }
        return this.cachedRoot;
    }
    get path() {
        return this.parentPath.concat([this.name]);
    }
    createDescendant(file, parentPath) {
        let f;
        if (file instanceof files.Directory) {
            return new CachedProxyDirectory(file, parentPath, this.root);
        }
        else {
            return new ChangeEventProxyFile(file);
        }
    }
    getFile(pathArray) {
        const _super = Object.create(null, {
            getFile: { get: () => super.getFile }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (pathArray.length === 0) {
                return this;
            }
            let absolutePath = this.path.concat(pathArray);
            let cached = this.root.getCached(absolutePath);
            if (cached !== null) {
                return cached;
            }
            let file = yield _super.getFile.call(this, pathArray);
            return this.createDescendant(file, absolutePath.slice(0, absolutePath.length - 1));
        });
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.childCache === null) {
                let children = yield _super.getChildren.call(this);
                this.childCache = [];
                for (let child of children) {
                    let cachedChild = this.createDescendant(child, this.path);
                    this.childCache.push(cachedChild);
                }
            }
            return this.childCache.slice();
        });
    }
    addFile(fileData, filename, mimeType) {
        const _super = Object.create(null, {
            addFile: { get: () => super.addFile }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let f = yield _super.addFile.call(this, fileData, filename, mimeType);
            return new ChangeEventProxyFile(f);
        });
    }
    addDirectory(name) {
        const _super = Object.create(null, {
            addDirectory: { get: () => super.addDirectory }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let f = yield _super.addDirectory.call(this, name);
            return new CachedProxyDirectory(f, this.path, this.root);
        });
    }
    add(absolutePath, file) {
        if (this.cachedRoot === null) {
            let key = absolutePath.map(encodeURIComponent).join('/');
            this.pathCache[key] = file;
        }
        else {
            this.cachedRoot.add(absolutePath, file);
        }
    }
    getCached(absolutePath) {
        if (this.cachedRoot === null) {
            let key = absolutePath.map(encodeURIComponent).join('/');
            return this.pathCache[key] || null;
        }
        else {
            return this.cachedRoot.getCached(absolutePath);
        }
    }
    clearCache() {
        this.childCache = null;
        if (this.cachedRoot === null) {
            this.pathCache = {};
        }
        else {
            this.cachedRoot.clearCache();
        }
    }
}
export class CachedProxyDirectory extends CachedProxyDirectoryBase {
    constructor(concreteDirectory, parentPath, rootDirectory) {
        super(concreteDirectory, parentPath, rootDirectory);
    }
}
export class CachedProxyRootDirectory extends CachedProxyDirectoryBase {
    constructor(concreteDirectory) {
        super(concreteDirectory, [], null);
    }
}
