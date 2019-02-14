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
const base_1 = require("./base");
/**
 * Proxy to an file
 * @property {BasicFile} concreteFile - The file to proxy
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
exports.ProxyDirectory = ProxyDirectory;
class CachedProxyDirectory extends ProxyDirectory {
    constructor() {
        super(...arguments);
        this.cachedChildren = null;
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            console.log("PRECAC");
            if (this.cachedChildren === null) {
                this.cachedChildren = [];
                console.log("CH", yield _super.getChildren.call(this));
                for (let child of yield _super.getChildren.call(this)) {
                    if (child instanceof base_1.Directory) {
                        child = new CachedProxyDirectory(child);
                    }
                    this.cachedChildren.push(child);
                }
            }
            return this.cachedChildren.slice();
        });
    }
    clearCache() {
        this.cachedChildren = null;
    }
}
exports.CachedProxyDirectory = CachedProxyDirectory;
