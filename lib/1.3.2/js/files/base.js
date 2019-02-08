import { parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer } from "../utils";
export class FileNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
export function isDirectory(file) {
    return file.directory;
}
/**
 * @abstract
 * An object representing a file.
 */
export class BasicFile {
    constructor() {
        this._onChangeListeners = [];
        // this.write = this.wrapChangeFunc(this.write);
        // this.rename = this.wrapChangeFunc(this.rename);
        // this.delete = this.wrapChangeFunc(this.delete);
        // this.move = this.wrapChangeFunc(this.move);
    }
    // wrapChangeFunc(func) {
    //     let wrapped = async (...args) => {
    //         let ret = await func(...args);
    //         this.onChange(id);
    //         return ret;
    //     };
    //     return wrapped.bind(this);
    // }
    onChange() {
        for (let listener of this._onChangeListeners) {
            listener(this);
        }
    }
    addOnChangeListener(listener) {
        this._onChangeListeners.push(listener);
    }
    get directory() {
        return false;
    }
    /**
     * Read the file as a string.
     * @async
     * @param {Object} [params={}] - Read parameters.
     * @returns {string} - File file data converted to a string.
     */
    async readText(params) {
        let arrayBuffer = await this.read(params);
        return parseTextArrayBuffer(arrayBuffer);
    }
    /**
     * Read the file as a json encoded string and convert to a Javascript Object.
     * @async
     * @param {Object} [params={}] - Read parameters.
     * @returns {Object|Array} - File file data converted to a Javascript Object.
     */
    async readJSON(params) {
        let arrayBuffer = await this.read(params);
        return parseJsonArrayBuffer(arrayBuffer);
    }
    async copy(targetDirectory) {
        await targetDirectory.write(await this.read());
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
    get mimeType() {
        return Directory.mimeType;
    }
    get size() {
        return 0;
    }
    get url() {
        return null;
    }
    async read(params) {
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
    /**
     * Get the file object at the given path relative to this directory.
     * @returns {Promise<File>} - The file object located at the given path.
     * @throws FileNotFoundError
     */
    async getFile(pathArray) {
        if (pathArray.length === 0) {
            return this;
        }
        let name = pathArray[pathArray.length - 1];
        let parentPath = pathArray.slice(0, pathArray.length - 1);
        let parentFile = await this.getFile(parentPath);
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
}
