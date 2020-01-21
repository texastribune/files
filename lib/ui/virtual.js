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
                        this.addDirectory(added.directory)
                            .then(() => {
                            this.dispatchEvent(new Event(VirtualDirectoryElement.EVENT_MOUNTED, { bubbles: true }));
                        });
                    }
                }
                for (let removed of mutation.removedNodes) {
                    if (removed instanceof DirectoryElement) {
                        this.removeDirectory(removed.directory)
                            .then(() => {
                            this.dispatchEvent(new Event(VirtualDirectoryElement.EVENT_UNMOUNTED, { bubbles: true }));
                        });
                    }
                }
            }
        });
        observer.observe(this, { childList: true });
        this.directory = new VirtualFS(new MemoryDirectory(null, "root"));
    }
    updateFromAttributes(attributes) {
    }
    async addDirectory(directory) {
        let mountPoint = await this.directory.addDirectory(directory.name);
        mountPoint.mount(directory);
    }
    async removeDirectory(directory) {
        let mounted = await this.directory.getFile([directory.name]);
        if (mounted instanceof VirtualRootDirectory) {
            mounted.unmount();
        }
        let mountPoint = await this.directory.getFile([directory.name]);
        await mountPoint.delete();
    }
}
/**
 * @event
 */
VirtualDirectoryElement.EVENT_MOUNTED = 'mounted';
/**
 * @event
 */
VirtualDirectoryElement.EVENT_UNMOUNTED = 'unmounted';
customElements.define('virtual-fs', VirtualDirectoryElement);
