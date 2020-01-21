import { parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer } from "../utils.js";
export class FileNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
export class FileAlreadyExistsError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
/**
 * Get the file object at the given path relative to the given directory.
 * @async
 * @param pathArray - The path relative to the given directory.
 * @param directory - The directory from which to walk the path.
 * @returns {Promise<File>} - The file object located at the given path.
 * @throws FileNotFoundError
 */
export async function walkPath(pathArray, directory) {
    if (pathArray.length === 0) {
        return directory;
    }
    let name = pathArray[pathArray.length - 1];
    let parentPath = pathArray.slice(0, pathArray.length - 1);
    let parentFile = await walkPath(parentPath, directory);
    let fileObjectsArray;
    if (parentFile instanceof Directory) {
        fileObjectsArray = await parentFile.getChildren();
    }
    else {
        throw new FileNotFoundError(`File ${name} not found.`);
    }
    let matchingFile;
    while (matchingFile === undefined) {
        let fileObject = fileObjectsArray.pop();
        if (fileObject === undefined) {
            throw new FileNotFoundError(`File ${name} not found.`);
        }
        if (fileObject.name === name) {
            matchingFile = fileObject;
        }
    }
    return matchingFile;
}
/**
 * @abstract
 * An object representing a file.
 */
export class BasicFile {
    constructor() {
        this.onChangeListeners = new Set();
    }
    /**
     * Call whenever a file is changed.
     */
    dispatchChangeEvent() {
        for (let listener of this.onChangeListeners) {
            listener(this);
        }
    }
    addOnChangeListener(listener) {
        this.onChangeListeners.add(listener);
    }
    removeOnChangeListener(listener) {
        this.onChangeListeners.delete(listener);
    }
    get directory() {
        return false;
    }
    /**
     * Read the file as a string.
     * @async
     */
    async readText() {
        let arrayBuffer = await this.read();
        return parseTextArrayBuffer(arrayBuffer);
    }
    /**
     * Read the file as a json encoded string and convert to a Javascript Object.
     * @async
     */
    async readJSON() {
        let arrayBuffer = await this.read();
        return parseJsonArrayBuffer(arrayBuffer);
    }
    async copy(targetDirectory) {
        let data = await this.read();
        await targetDirectory.addFile(data, this.name, this.mimeType);
    }
    async move(targetDirectory) {
        await this.copy(targetDirectory);
        await this.delete();
    }
    toString() {
        return this.name;
    }
}
/**
 * An object representing a directory.
 */
export class Directory extends BasicFile {
    static get mimeType() {
        return 'application/json';
    }
    get directory() {
        return true;
    }
    get mimeType() {
        return Directory.mimeType;
    }
    get size() {
        return 0;
    }
    get url() {
        return null;
    }
    async read() {
        let fileData = [];
        let children = await this.getChildren();
        for (let child of children) {
            fileData.push({
                id: child.id,
                name: child.name,
                directory: child.directory,
                url: child.url,
                icon: child.icon,
                size: child.size,
                mimeType: child.mimeType,
                lastModified: child.lastModified.toISOString(),
                created: child.created.toISOString(),
                extra: child.extra
            });
        }
        let jsonString = JSON.stringify(fileData);
        return stringToArrayBuffer(jsonString);
    }
    async write(data) {
        throw new Error("Cannot write to a directory.");
    }
    async copy(targetDirectory) {
        let copy = await targetDirectory.addDirectory(this.name);
        for (let child of await this.getChildren()) {
            await child.copy(copy);
        }
    }
    /**
     * Get the file object at the given path relative to this directory.
     * @returns {Promise<File>} - The file object located at the given path.
     * @throws FileNotFoundError
     */
    getFile(pathArray) {
        return walkPath(pathArray, this);
    }
}
