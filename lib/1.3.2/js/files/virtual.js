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
const proxy_1 = require("./proxy");
const files = __importStar(require("./base"));
class VirtualDirectory extends proxy_1.ProxyDirectory {
    constructor(concreteDirectory, mounts) {
        super(concreteDirectory);
        this.mounts = mounts || {};
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
                    virtualChildren.push(new VirtualDirectory(mounted));
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
    }
}
exports.VirtualDirectory = VirtualDirectory;
