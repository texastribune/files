import { ProxyDirectory } from "./proxy";
import * as files from "./base";
export declare class VirtualDirectory extends ProxyDirectory {
    private readonly mounts;
    constructor(concreteDirectory: files.Directory, mounts?: {
        [id: string]: files.Directory;
    });
    getChildren(): Promise<files.File[]>;
    addDirectory(name: string): Promise<VirtualDirectory>;
    mount(file: files.Directory): void;
}
