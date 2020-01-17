import { ProxyDirectory } from "./proxy.js";
import * as files from "./base.js";
import { walkPath } from "./base.js";
class AbstractVirtualDirectory extends ProxyDirectory {
    getFile(pathArray) {
        // Force to walk path so that mount points are checked.
        return walkPath(pathArray, this);
    }
    async getChildren() {
        let children = await super.getChildren();
        let virtualChildren = [];
        for (let child of children) {
            let mountPointData = this.virtualRoot.getMountedData(child.id);
            if (mountPointData !== null) {
                child = new VirtualRootDirectory(mountPointData.directory, mountPointData.subMounts, child, this);
            }
            else if (child instanceof files.Directory) {
                child = new VirtualDirectory(child, this);
            }
            virtualChildren.push(child);
        }
        return virtualChildren;
    }
    async addDirectory(name) {
        let dir = await super.addDirectory(name);
        return new VirtualDirectory(dir, this);
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
