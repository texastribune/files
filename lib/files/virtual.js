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
export class VirtualDirectory extends ProxyDirectory {
    constructor(concreteDirectory, mounts) {
        super(concreteDirectory);
        this.mounts = mounts;
    }
    getChildren() {
        const _super = Object.create(null, {
            getChildren: { get: () => super.getChildren }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let children = yield _super.getChildren.call(this);
            let virtualChildren = [];
            for (let child of children) {
                let mounted = this.mounts[child.id];
                if (mounted !== undefined) {
                    virtualChildren.push(new MountedDirectory(mounted, child.name));
                }
                else {
                    if (child instanceof files.Directory) {
                        virtualChildren.push(new VirtualDirectory(child, this.mounts));
                    }
                    else {
                        virtualChildren.push(child);
                    }
                }
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
            return new VirtualDirectory(dir, this.mounts);
        });
    }
    mount(file) {
        this.mounts[this.id] = file;
        file.addOnChangeListener((file) => {
            this.dispatchChangeEvent();
        });
        this.dispatchChangeEvent();
    }
    unount(file) {
        if (this.mounts.hasOwnProperty(file.id)) {
            delete this.mounts[file.id];
            this.dispatchChangeEvent();
        }
    }
}
class MountedDirectory extends VirtualDirectory {
    constructor(concreteDirectory, name) {
        super(concreteDirectory, {});
        this.mountPointName = name;
    }
    get name() {
        return this.mountPointName;
    }
}
export class VirtualFS extends MountedDirectory {
    constructor(concreteDirectory) {
        super(concreteDirectory, concreteDirectory.name);
    }
}
