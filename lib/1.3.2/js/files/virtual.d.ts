import { ProxyDirectory } from "./proxy";
import { Directory } from "./base";
declare class AbstractVirtualDirectory extends ProxyDirectory {
    constructor(concreteDirectory: Directory);
    readonly virtualRoot: void;
    getChildren(): Promise<import("./base").File[]>;
}
export declare class VirtualRootDirectory extends AbstractVirtualDirectory {
    constructor(concreteFile: any);
    readonly virtualRoot: this;
    mount(mountPoint: any, directory: any): Promise<void>;
}
export {};
