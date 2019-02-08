import * as files from "./base";
import { Directory } from "./base";
/**
 * Proxy to an file
 * @property {BasicFile} concreteFile - The file to proxy
 */
export class ProxyFile extends files.BasicFile {
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
    read(params) {
        return this.concreteFile.read(params);
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
/**
 * Proxy to an file
 * @property {Directory} concreteDirectory - The directory to proxy
 */
export class ProxyDirectory extends files.Directory {
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
    getFile(pathArray) {
        return this.concreteDirectory.getFile(pathArray);
    }
    getChildren() {
        return this.concreteDirectory.getChildren();
    }
}
export class CachedProxyDirectory extends ProxyDirectory {
    constructor() {
        super(...arguments);
        this.cachedChildren = null;
    }
    async getChildren() {
        if (this.cachedChildren === null) {
            this.cachedChildren = [];
            for (let child of await super.getChildren()) {
                if (child instanceof Directory) {
                    child = new CachedProxyDirectory(child);
                }
                this.cachedChildren.push(child);
            }
        }
        return this.cachedChildren.slice();
    }
    clearCache() {
        this.cachedChildren = null;
    }
}
