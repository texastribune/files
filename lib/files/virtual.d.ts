import { ProxyDirectory } from "./proxy";
import * as files from "./base";
declare class VirtualDirectory extends ProxyDirectory {
    private readonly mounts;
    constructor(concreteDirectory: files.Directory, mounts: {
        [id: string]: files.Directory;
    });
    getChildren(): Promise<files.File[]>;
    addDirectory(name: string): Promise<VirtualDirectory>;
    mount(file: files.Directory): void;
}
declare class MountedDirectory extends VirtualDirectory {
    private readonly mountPointName;
    constructor(concreteDirectory: files.Directory, name: string);
    readonly name: string;
}
export declare class VirtualFS extends MountedDirectory {
    constructor(concreteDirectory: files.Directory);
}
export {};
