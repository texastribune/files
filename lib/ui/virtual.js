var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MemoryDirectory } from "../files/memory.js";
import { DirectoryElement } from "./files.js";
import { VirtualFS, VirtualRootDirectory } from "../files/virtual.js";
export class VirtualDirectoryElement extends DirectoryElement {
    constructor() {
        super();
        let observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                for (let added of mutation.addedNodes) {
                    if (added instanceof DirectoryElement) {
                        this.addDirectory(added.directory);
                    }
                }
                for (let removed of mutation.removedNodes) {
                    if (removed instanceof DirectoryElement) {
                        this.removeDirectory(removed.directory);
                    }
                }
            }
        });
        observer.observe(this, { childList: true });
        this.directory = new VirtualFS(new MemoryDirectory(null, "root"));
    }
    updateFromAttributes(attributes) {
    }
    addDirectory(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            let mountPoint = yield this.directory.addDirectory(directory.name);
            mountPoint.mount(directory);
        });
    }
    removeDirectory(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            let mounted = yield this.directory.getFile([directory.name]);
            if (mounted instanceof VirtualRootDirectory) {
                mounted.unmount();
            }
            let mountPoint = yield this.directory.getFile([directory.name]);
            yield mountPoint.delete();
        });
    }
}
customElements.define('virtual-fs', VirtualDirectoryElement);
