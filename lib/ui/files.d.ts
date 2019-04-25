import { CustomElement } from "elements/lib/element";
import { Directory } from "../files/base";
import { MemoryDirectory } from "../files/memory";
import { LocalStorageRoot } from "../files/local";
import { RemoteFS } from "../files/remote";
import { NodeDirectory } from "../files/node";
export declare abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory: Directory;
    private mounted;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
export declare class MemoryDirectoryElement extends DirectoryElement {
    protected readonly directory: MemoryDirectory;
    constructor();
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
export declare class LocalStorageDirectoryElement extends DirectoryElement {
    protected readonly directory: LocalStorageRoot;
    constructor();
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
export declare class RemoteDirectoryElement extends DirectoryElement {
    protected directory: RemoteFS;
    static urlAttribute: string;
    constructor();
    static readonly observedAttributes: string[];
    url: string;
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
export declare class NodeDirectoryElement extends DirectoryElement {
    protected directory: NodeDirectory;
    static pathAttribute: string;
    constructor();
    static readonly observedAttributes: string[];
    path: string;
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
