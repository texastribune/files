import * as files from "./base.js";
/**
 * Proxy to a file
 */
export class ProxyFile extends files.BasicFile {
    constructor(concreteFile) {
        super();
        this.concreteFile = concreteFile;
        this.concreteFile.addOnChangeListener(this.dispatchChangeEvent.bind(this));
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
        this.concreteDirectory.addOnChangeListener(this.dispatchChangeEvent.bind(this));
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
    async write(data) {
        let ret = await super.write(data);
        this.dispatchChangeEvent();
        return ret;
    }
    async rename(newName) {
        let ret = await super.rename(newName);
        this.dispatchChangeEvent();
        return ret;
    }
    async delete() {
        let ret = await super.delete();
        this.dispatchChangeEvent();
        return ret;
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
        this.addOnChangeListener(this.clearCache.bind(this));
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
    async getFile(pathArray) {
        if (pathArray.length === 0) {
            return this;
        }
        let absolutePath = this.path.concat(pathArray);
        let cached = this.root.getCached(absolutePath);
        if (cached !== null) {
            return cached;
        }
        let file = await super.getFile(pathArray);
        return this.createDescendant(file, absolutePath.slice(0, absolutePath.length - 1));
    }
    async getChildren() {
        if (this.childCache === null) {
            let children = await super.getChildren();
            this.childCache = [];
            for (let child of children) {
                let cachedChild = this.createDescendant(child, this.path);
                this.childCache.push(cachedChild);
            }
        }
        return this.childCache.slice();
    }
    async addFile(fileData, filename, mimeType) {
        let f = await super.addFile(fileData, filename, mimeType);
        return new ChangeEventProxyFile(f);
    }
    async addDirectory(name) {
        let f = await super.addDirectory(name);
        return new CachedProxyDirectory(f, this.path, this.root);
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
