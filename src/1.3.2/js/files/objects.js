import {parseJsonArrayBuffer, parseTextArrayBuffer} from "../utils.js";
import {BaseFileSystem} from "./systems.js";

/**
 * An Object that contains metadata about a file.
 * @typedef {Object} FileNode
 * @property {string} id - A unique identifier for the file specific to its domain.
 * @property {boolean} name - The name of the file.
 * @property {boolean} url - The URL the file data can be accessed from. May be a Data URL.
 * @property {boolean} directory - Is the file a directory.
 * @property {boolean|null} icon - The url the file data can be accessed from.
 * @property {number|null} size - The size in bytes of the file.
 * @property {string} mimeType - The MIME type of the file.
 * @property {string} lastModified - An ISO 8601 date string of when the file was last modified.
 * @property {string} created - An ISO 8601 date string of when the file was created.
 * @property {boolean} hidden - Whether or not the file should be displayed in a user interface by default.
 */


export class AbstractFile {
    /**
     * @returns {string[]} - The path of the file.
     */
    get path() {
        if (this.parent === null) {
            return [];
        }
        return this.parent.path.concat([this.fileNode.name]);
    }

    /**
     * @returns {BaseFileSystem} - The path of the file.
     */
    get root(){
        let obj = this;
        while (!(obj.parent === null || obj instanceof BaseFileSystem)){
            obj = obj.parent;
        }
        return obj;
    }

    get parent() {
        throw new Error("Not implemented");
    }

    /**
     * Read the file.
     * @async
     * @param {Object} [params={}] - Read parameters.
     * @returns {ArrayBuffer} - An ArrayBuffer containing the file data.
     */
    async read(params) {
        throw new Error("Not implemented")
    }

    /**
     * Read the file.
     * @async
     * @param {ArrayBuffer} data - Raw data to write to the file.
     * @returns {ArrayBuffer} - An ArrayBuffer containing the updated file data.
     */
    async write(data) {
        throw new Error("Not implemented");
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

    /**
     * Change the name of the file.
     * @async
     * @param {string} newName - The new name for the file.
     */
    async rename(newName) {
        throw new Error("Not implemented");
    }

    /**
     * Delete the file from its storage location.
     * @async
     */
    async delete() {
        throw new Error("Not implemented");
    }

    /**
     * Search the file and all of its children recursively based on the query.
     * @async
     * @param {string} query - Words to be searched seperated by spaces.
     * @returns {FileObject[]} - A list of file objects.
     */
    async search(query) {
        throw new Error("Not implemented");
    }

    toString() {
        return `/${this.path.join('/')}`;
    }

    /**
     * Return a javascript Object mapping file names to file objects for each file in the
     * directory represented by the given fileObject.
     * @async
     * @returns {FileObject[]} - Array of FileObjects for each file in the given directory.
     */
    async getChildren() {
        throw new Error("Not implemented");
    }
}

/**
 * An object representing a file or directory in a file system.
 * @param {FileNode} fileNode - The FileNode object representing the file
 * @param {FileObject|null} parentFileObject - The parent directory for this file. Null if root directory.
 * @param {AbstractFileStorage} fileStorage - the file storage for this file.
 */
export class FileObject extends  AbstractFile {
    constructor(fileNode, parentFileObject, fileStorage) {
        this._fileNode = fileNode;
        this._parent = parentFileObject;
        this._fileStorage = fileStorage;

        this._filePromiseCache = null;  // Initialize cache with empty value
    }

    /**
     * @returns {string[]} - The path of the file.
     */
    get path() {
        if (this.parent === null) {
            return [];
        }
        return this.parent.path.concat([this.fileNode.name]);
    }

    /**
     * @returns {BaseFileSystem} - The path of the file.
     */
    get root(){
        let obj = this;
        while (!(obj.parent === null || obj instanceof BaseFileSystem)){
            obj = obj.parent;
        }
        return obj;
    }

    get fileNode() {
        return this._fileNode;
    }

    get parent() {
        return this._parent;
    }

    get fileStorage() {
        return this._fileStorage;
    }

    /**
     * Clear the file cache.
     */
    clearCache() {
        this._filePromiseCache = null;
        let parent = this.parent;
        if (parent){
          parent.clearCache();
        }
    }

    /**
     * Read the file.
     * @async
     * @param {Object} [params={}] - Read parameters.
     * @returns {ArrayBuffer} - An ArrayBuffer containing the file data.
     */
    async read(params) {
        if (this._filePromiseCache === null){
          this._filePromiseCache = this.fileStorage.readFileNode(this.fileNode.id, params);
        }
        return await this._filePromiseCache;
    }

    /**
     * Read the file.
     * @async
     * @param {ArrayBuffer} data - Raw data to write to the file.
     * @returns {ArrayBuffer} - An ArrayBuffer containing the updated file data.
     */
    async write(data) {
        this.clearCache();
        return await this.fileStorage.writeFileNode(this.fileNode.id, data);
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

    /**
     * Change the name of the file.
     * @async
     * @param {string} newName - The new name for the file.
     */
    async rename(newName) {
        this.clearCache();
        await this.fileStorage.rename(this.fileNode.id, newName);
        this.fileNode.name = newName;
    }

    /**
     * Delete the file from its storage location.
     * @async
     */
    async delete() {
        this.clearCache();
        return await this.fileStorage.delete(this.fileNode.id);
    }

    /**
     * Search the file and all of its children recursively based on the query.
     * @async
     * @param {string} query - Words to be searched seperated by spaces.
     * @returns {FileObject[]} - A list of file objects.
     */
    async search(query) {
        let fileObjectList = [];
        let fileNodeList = await this.fileStorage.search(this.fileNode.id, query);
        for (let node of fileNodeList) {
            fileObjectList.push(new FileObject(node, this, this.fileStorage));
        }
        return fileObjectList;
    }

    toString() {
        return `/${this.path.join('/')}`;
    }

    /**
     * Return a javascript Object mapping file names to file objects for each file in the
     * directory represented by the given fileObject.
     * @async
     * @returns {FileObject[]} - Array of FileObjects for each file in the given directory.
     */
    async getChildren() {
        if (!this.fileNode.directory){
            throw new Error(`File ${this} is not a directory`);
        }

        let childNodes = await this.readJSON();
        let fileObjects = [];
        for (let childNode of childNodes) {
            fileObjects.push(new FileObject(childNode, this, this.fileStorage));
        }
        return fileObjects;
    }
}
