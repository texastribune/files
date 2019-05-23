var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "./base.js";
import { ProxyFile } from "./proxy.js";
import { VirtualDirectory } from "./virtual.js";
/**
 * Fires change event for local file changes such as write, rename, delete, etc.
 */
export class BrowserProxyFile extends ProxyFile {
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
 * Fires change event for local file changes such as rename, delete, etc. as well as
 * when those changes happen on children of the directory. Caches the children of the directory for when getChildren
 * is called. Listens for change events to invalidate the cache.
 */
export class BrowserProxyDirectory extends VirtualDirectory {
    constructor(concreteDirectory, parentDirectory) {
        super(concreteDirectory);
        this.cachedChildren = null;
        this.parent = parentDirectory || null;
    }
    dispatchChangeEvent() {
        this.clearCache();
        super.dispatchChangeEvent();
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
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cachedChildren === null) {
                this.cachedChildren = yield _super.getChildren.call(this);
            }
            let children = [];
            for (let child of this.cachedChildren) {
                if (child instanceof files.Directory) {
                    child = new BrowserProxyDirectory(child);
                }
                else {
                    child = new BrowserProxyFile(child);
                }
                child.addOnChangeListener(() => {
                    this.dispatchChangeEvent();
                });
                children.push(child);
            }
            return children;
        });
    }
    clearCache() {
        this.cachedChildren = null;
    }
}
/**
 * Caches the children of the directory for when getChildren is called. Listens for change events
 * to invalidate the cache.
 */
export class CachedProxyDirectory extends BrowserProxyDirectory {
    constructor(concreteDirectory, parentDirectory) {
        super(concreteDirectory, parentDirectory);
        this.cachedChildren = null;
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
            return new BrowserProxyFile(child);
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
