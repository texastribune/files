import * as files from "./base.js";
import { Requester } from "../utils.js";
import { Directory, listener } from "./base.js";
import { File } from "./base.js";
interface FileData {
    id: string;
    name: string;
    directory: boolean;
    mimeType: string;
    lastModified: string;
    created: string;
    url: string | null;
    icon: string | null;
    size: number;
}
declare class RemoteFile extends files.BasicFile {
    private readonly parent;
    private readonly fileData;
    private readonly apiUrl;
    private readonly listenerMap;
    private readonly requester;
    readonly extra: {};
    constructor(parent: RemoteDirectory, fileData: FileData, apiUrl: URL, listenerMap: {
        [name: string]: Set<listener>;
    }, requester?: Requester);
    get id(): string;
    get name(): string;
    get mimeType(): string;
    get lastModified(): Date;
    get created(): Date;
    private get urlObject();
    get url(): string;
    get icon(): string | null;
    get size(): number;
    dispatchChangeEvent(): void;
    addOnChangeListener(listener: (file: File) => void): void;
    removeOnChangeListener(listener: (file: File) => void): void;
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer | FormData): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: Directory): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
}
declare class RemoteDirectory extends files.Directory {
    static addDirectoryName: string;
    static addFileName: string;
    static renameFileName: string;
    static deleteFileName: string;
    static copyFileName: string;
    static moveFileName: string;
    static searchFileName: string;
    private readonly parent;
    private readonly fileData;
    private readonly apiUrl;
    private readonly listenerMap;
    private readonly requester;
    readonly extra: {};
    constructor(parent: RemoteDirectory | null, fileData: FileData, apiUrl: URL, listenerMap: {
        [name: string]: Set<listener>;
    }, requester?: Requester);
    get id(): string;
    get name(): string;
    get lastModified(): Date;
    get created(): Date;
    private get urlObject();
    get url(): string;
    get icon(): string | null;
    get size(): number;
    dispatchChangeEvent(): void;
    addOnChangeListener(listener: (file: File) => void): void;
    removeOnChangeListener(listener: (file: File) => void): void;
    read(): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: Directory): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
    search(query: string): Promise<files.SearchResult[]>;
    addFile(data: ArrayBuffer, filename: string, mimeType?: string): Promise<RemoteFile>;
    addDirectory(name: string): Promise<RemoteDirectory>;
    getChildren(): Promise<files.File[]>;
}
export declare class RemoteFS extends RemoteDirectory {
    constructor(name: string, apiUrl: URL | string, rootId: string, requester?: Requester);
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
}
export {};
