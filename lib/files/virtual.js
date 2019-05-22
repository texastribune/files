var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ProxyDirectory } from "./proxy.js";
import * as files from "./base.js";
class AbstractVirtualDirectory extends ProxyDirectory {
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let root = this.virtualRoot;
            let children = yield _super.getChildren.call(this);
            let virtualChildren = [];
            for (let child of children) {
                let mountPointData = root.getMountedData(child.id);
                if (mountPointData !== null) {
                    child = new VirtualRootDirectory(mountPointData.directory, mountPointData.subMounts, child, this);
                }
                else if (child instanceof files.Directory) {
                    child = new VirtualDirectory(child, this);
                }
                virtualChildren.push(child);
            }
            return virtualChildren;
        });
    }
    addDirectory(name) {
        const _super = Object.create(null, {
            addDirectory: { get: () => super.addDirectory }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let dir = yield _super.addDirectory.call(this, name);
            return new VirtualDirectory(dir, this);
        });
    }
    mount(file) {
        this.virtualRoot.mountTo(this, file);
    }
}
export class VirtualDirectory extends AbstractVirtualDirectory {
    constructor(concreteDirectory, parent) {
        super(concreteDirectory);
        this.parent = parent;
    }
    get virtualRoot() {
        return this.parent.virtualRoot;
    }
    get path() {
        return this.parent.path.concat([this.name]);
    }
}
class AbstractVirtualRootDirectory extends AbstractVirtualDirectory {
    constructor(concreteDirectory, mounts) {
        super(concreteDirectory);
        this.mounts = mounts;
    }
    get virtualRoot() {
        return this;
    }
    mountTo(mountPoint, file) {
        this.mounts[mountPoint.id] = {
            directory: file,
            subMounts: {},
        };
        this.dispatchChangeEvent();
    }
    unmountFrom(mountPoint) {
        if (this.mounts.hasOwnProperty(mountPoint.id)) {
            delete this.mounts[mountPoint.id];
            this.dispatchChangeEvent();
        }
    }
    getMountedData(id) {
        return this.mounts[id] || null;
    }
}
export class VirtualRootDirectory extends AbstractVirtualRootDirectory {
    constructor(concreteDirectory, mounts, mountPoint, parent) {
        super(concreteDirectory, mounts);
        this.mountPoint = mountPoint;
        this.parent = parent;
    }
    get path() {
        return this.parent.path.concat([this.name]);
    }
    get name() {
        return this.mountPoint.name;
    }
    unmount() {
        this.parent.virtualRoot.unmountFrom(this.mountPoint);
    }
}
export class VirtualFS extends AbstractVirtualRootDirectory {
    constructor(concreteDirectory) {
        super(concreteDirectory, {});
    }
    get path() {
        return [this.name];
    }
    get name() {
        return "";
    }
}
