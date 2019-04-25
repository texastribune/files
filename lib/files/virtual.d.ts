import { ProxyDirectory } from "./proxy";
import * as files from "./base";
export declare class VirtualDirectory<T extends files.Directory> extends ProxyDirectory<T> {
    private readonly mounts;
    constructor(concreteDirectory: T, mounts: {
        [id: string]: files.Directory;
    });
    getChildren(): Promise<files.File[]>;
    addDirectory(name: string): Promise<files.Directory>;
    mount(file: files.Directory): void;
    unount(file: files.Directory): void;
}
declare class MountedDirectory<T extends files.Directory> extends VirtualDirectory<T> {
    private readonly mountPointName;
    constructor(concreteDirectory: T, name: string);
    readonly name: string;
}
export declare class VirtualFS<T extends files.Directory> extends MountedDirectory<T> {
    constructor(concreteDirectory: T);
}
export {};
