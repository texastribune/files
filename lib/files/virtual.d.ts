import { ProxyDirectory } from "./proxy.js";
import * as files from "./base.js";
declare abstract class AbstractVirtualDirectory<T extends files.Directory> extends ProxyDirectory<T> {
    abstract readonly virtualRoot: AbstractVirtualRootDirectory<files.Directory>;
    abstract readonly path: string[];
    getFile(pathArray: string[]): Promise<files.File>;
    getChildren(): Promise<files.File[]>;
    addDirectory(name: string): Promise<VirtualDirectory<files.Directory>>;
    mount(file: files.Directory): void;
}
export declare class VirtualDirectory<T extends files.Directory> extends AbstractVirtualDirectory<T> {
    protected readonly parent: AbstractVirtualDirectory<files.Directory>;
    constructor(concreteDirectory: T, parent: AbstractVirtualDirectory<files.Directory>);
    get virtualRoot(): AbstractVirtualRootDirectory<files.Directory>;
    get path(): string[];
}
interface MountPointData {
    directory: files.Directory;
    subMounts: {
        [id: string]: MountPointData;
    };
}
declare abstract class AbstractVirtualRootDirectory<T extends files.Directory> extends AbstractVirtualDirectory<T> {
    private readonly mounts;
    protected constructor(concreteDirectory: T, mounts: {
        [id: string]: MountPointData;
    });
    get virtualRoot(): this;
    mountTo(mountPoint: AbstractVirtualDirectory<files.Directory>, file: files.Directory): void;
    unmountFrom(mountPoint: files.File): void;
    getMountedData(id: string): MountPointData | null;
}
export declare class VirtualRootDirectory<T extends files.Directory> extends AbstractVirtualRootDirectory<T> {
    private readonly mountPoint;
    private readonly parent;
    constructor(concreteDirectory: T, mounts: {
        [id: string]: MountPointData;
    }, mountPoint: files.File, parent: AbstractVirtualDirectory<files.Directory>);
    get path(): string[];
    get name(): string;
    unmount(): void;
}
export declare class VirtualFS<T extends files.Directory> extends AbstractVirtualRootDirectory<T> {
    constructor(concreteDirectory: T);
    get path(): string[];
    get name(): string;
}
export {};
