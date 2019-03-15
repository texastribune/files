export declare class FileNotFoundError extends Error {
    constructor(message: string);
}
export declare class FileAlreadyExistsError extends Error {
    constructor(message: string);
}
export interface File {
    addOnChangeListener(listener: (file: File) => void): void;
    removeOnChangeListener(listener: (file: File) => void): void;
    /**
      * A string id of the file unique between this file and all descendants/ancestors.
     */
    readonly id: string;
    /**
     * The name of the file.
     */
    readonly name: string;
    /**
     * Whether or not this file is a directory.
     */
    readonly directory: boolean;
    /**
     * The url where the file can be accessed. Can be a data url.
     */
    readonly url: string | null;
    /**
     * The url for an image representation of the file.
     */
    readonly icon: string | null;
    /**
     * The file size in bytes.
     */
    readonly size: number;
    /**
     * The MIME type of the file.
     */
    readonly mimeType: string;
    /**
     * The time when the file was created.
     */
    readonly created: Date;
    /**
     * The time when the file was last modified.
     */
    readonly lastModified: Date;
    /**
     * Extra file metadata
     */
    readonly extra: Object;
    /**
     * Read the file.
     */
    read(): Promise<ArrayBuffer>;
    /**
     * Update the data of the file. It will overwrite any existing data.
     */
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    /**
     * Rename the file.
     */
    rename(newName: string): Promise<void>;
    /**
     * Delete the file.
     */
    delete(): Promise<void>;
    /**
     * Copy the file into the targetDirectory.
     */
    copy(targetDirectory: Directory): Promise<void>;
    /**
     * Move the file into the targetDirectory.
     */
    move(targetDirectory: Directory): Promise<void>;
}
/**
 * @abstract
 * An object representing a file.
 */
export declare abstract class BasicFile implements File {
    private readonly onChangeListeners;
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly url: string | null;
    abstract readonly icon: string | null;
    abstract readonly size: number;
    abstract readonly mimeType: string;
    abstract readonly created: Date;
    abstract readonly lastModified: Date;
    abstract readonly extra: Object;
    /**
     * Call whenever a file is changed.
     */
    protected onChange(): void;
    addOnChangeListener(listener: (file: File) => void): void;
    removeOnChangeListener(listener: (file: File) => void): void;
    readonly directory: boolean;
    abstract read(): Promise<ArrayBuffer>;
    abstract write(data: ArrayBuffer): Promise<ArrayBuffer>;
    abstract rename(newName: string): Promise<void>;
    abstract delete(): Promise<void>;
    /**
     * Read the file as a string.
     * @async
     * @returns {string} - File file data converted to a string.
     */
    readText(): Promise<string>;
    /**
     * Read the file as a json encoded string and convert to a Javascript Object.
     * @async
     * @returns {Object|Array} - File file data converted to a Javascript Object.
     */
    readJSON(): Promise<any>;
    copy(targetDirectory: Directory): Promise<void>;
    move(targetDirectory: Directory): Promise<void>;
    toString(): string;
}
/**
 * An object representing a directory.
 */
export declare abstract class Directory extends BasicFile {
    static readonly mimeType: string;
    readonly directory: boolean;
    readonly mimeType: string;
    readonly size: number;
    readonly url: string | null;
    read(): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    /**
     * Get the file object at the given path relative to this directory.
     * @returns {Promise<File>} - The file object located at the given path.
     * @throws FileNotFoundError
     */
    getFile(pathArray: string[]): Promise<File>;
    abstract search(query: string): Promise<SearchResult[]>;
    abstract addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<File>;
    abstract addDirectory(name: string): Promise<Directory>;
    abstract getChildren(): Promise<File[]>;
}
export interface SearchResult {
    path: string[];
    file: File;
}
