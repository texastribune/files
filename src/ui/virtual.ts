import {MemoryDirectory} from "../files/memory.js";
import {DirectoryElement} from "./files.js";
import {VirtualFS, VirtualRootDirectory} from "../files/virtual.js";
import {Directory} from "../files/base.js";


export class VirtualDirectoryElement extends DirectoryElement {
    public readonly directory : VirtualFS<MemoryDirectory>;

    /**
     * @event
     */
    static EVENT_MOUNTED = 'mounted';

    /**
     * @event
     */
    static EVENT_UNMOUNTED = 'unmounted';

    constructor(){
        super();

        let observer = new MutationObserver((mutations) => {
            for (let mutation of mutations){
                for (let added of mutation.addedNodes) {
                    if (added instanceof DirectoryElement){
                        this.addDirectory(added.directory)
                            .then(() => {
                                this.dispatchEvent(new Event(VirtualDirectoryElement.EVENT_MOUNTED));
                            });
                    }
                }
                for (let removed of mutation.removedNodes) {
                    if (removed instanceof DirectoryElement){
                        this.removeDirectory(removed.directory)
                            .then(() => {
                                this.dispatchEvent(new Event(VirtualDirectoryElement.EVENT_UNMOUNTED));
                            });
                    }
                }
            }
        });
        observer.observe(this, {childList: true});

        this.directory = new VirtualFS(new MemoryDirectory(null, "root"));
    }

    updateFromAttributes(attributes: { [p: string]: string | null }): void {
    }

    async addDirectory(directory: Directory){
        let mountPoint = await this.directory.addDirectory(directory.name);
        mountPoint.mount(directory);
    }

    async removeDirectory(directory: Directory) {
        let mounted = await this.directory.getFile([directory.name]);
        if (mounted instanceof VirtualRootDirectory){
            mounted.unmount();
        }

        let mountPoint = await this.directory.getFile([directory.name]);
        await mountPoint.delete();
    }
}


customElements.define('virtual-fs', VirtualDirectoryElement);