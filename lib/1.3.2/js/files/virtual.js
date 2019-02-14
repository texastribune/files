"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_1 = require("./proxy");
class AbstractVirtualDirectory extends proxy_1.ProxyDirectory {
    constructor(concreteDirectory) {
        super(concreteDirectory);
    }
    get virtualRoot() {
        throw new Error("Not implemented");
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let children = yield _super.getChildren.call(this);
            let virtualChildren = [];
            for (let child of children) {
                if (child.directory) {
                    virtualChildren.push(new VirtualDirectory(this.virtualRoot, child));
                }
                else {
                    virtualChildren.push(child);
                }
            }
            return virtualChildren;
        });
    }
}
class VirtualDirectory extends AbstractVirtualDirectory {
    constructor(virtualRoot, concreteFile) {
        super(concreteFile);
        this._virtualRoot = virtualRoot;
    }
    get virtualRoot() {
        return this._virtualRoot;
    }
}
class VirtualRootDirectory extends AbstractVirtualDirectory {
    constructor(concreteFile) {
        super(concreteFile);
        this._mounts = {};
    }
    get virtualRoot() {
        return this;
    }
    mount(mountPoint, directory) {
        return __awaiter(this, void 0, void 0, function* () {
            this._mounts[mountPoint.id] = directory;
        });
    }
}
exports.VirtualRootDirectory = VirtualRootDirectory;
