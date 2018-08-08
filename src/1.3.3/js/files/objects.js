import {parseJsonFile, parseTextFile} from "../utils.js";

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


export class FileObject {
  /**
   * An object representing a file or directory in a file system. Provides API for
   * performing operations on the file.
   * @param {AbstractFileStorage} fileStorage - The file system the file is on
   * @param {FileNode} fileNode - The FileNode object representing the file
   * @param {string} name - The name of this file.
   * @param {FileObject|null} parent - The parent directory for this file. Null if root directory.
   */
  constructor(fileStorage, fileNode, name, parent) {
    this._fileStorage = fileStorage;
    this._fileNode = fileNode;
    this._name = name;
    this._parent = parent;
    this._filePromiseCache = null;
  }

  // Getters
  get fileStorage() {
    return this._fileStorage;
  }

  get fileNode() {
    return this._fileNode;
  }

  get id() {
    return this._fileNode.id;
  }

  get name() {
    return this._name;
  }

  get path() {
    if (this.parent === null) {
      return [];
    }
    return this.parent.path.concat([this.name]);
  }

  get url() {
    return this._fileNode.url;
  }

  get directory() {
    return this._fileNode.directory;
  }

  get icon() {
    return this._fileNode.icon;
  }

  get mimeType() {
    return this._fileNode.mimeType;
  }

  get size(){
    return this._fileNode.size;
  }

  get lastModified() {
    return this._fileNode.lastModified;
  }

  get created() {
    return this._fileNode.created;
  }

  get parent() {
    return this._parent;
  }

  /**
   * Clear the file cache.
   */
  clearCache(){
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
   * @returns {Blob} - Blob (https://developer.mozilla.org/en-US/docs/Web/API/Blob)
   */
  async read(params) {
    if (this._filePromiseCache === null){
      this._filePromiseCache = this.fileStorage.readFileNode(this.fileNode, params);
    }
    return await this._filePromiseCache;
  }

  /**
   * Read the file.
   * @async
   * @param {File|Blob} data - Raw data to write to the file.
   * @returns {File} - File (https://developer.mozilla.org/en-US/docs/Web/API/File)
   */
  async write(data) {
    this.clearCache();
    return await this.fileStorage.writeFileNode(this.fileNode, data);
  }

  /**
   * Read the file as a string.
   * @async
   * @param {Object} [params={}] - Read parameters.
   * @returns {string} - File file data converted to a string.
   */
  async readText(params) {
    let file = await this.read(params);
    return await parseTextFile(file);
  }

  /**
   * Read the file as a json encoded string and convert to a Javascript Object.
   * @async
   * @param {Object} [params={}] - Read parameters.
   * @returns {Object|Array} - File file data converted to a Javascript Object.
   */
  async readJSON(params) {
    let file = await this.read(params);
    return await parseJsonFile(file);
  }

  /**
   * Change the name of the file.
   * @async
   * @param {string} newName - The new name for the file.
   */
  async rename(newName) {
    this.clearCache();
    await this.fileStorage.rename(this.fileNode, newName);
    this._fileNode.name = newName;
  }

  /**
   * Delete the file from its storage location.
   * @async
   */
  async delete() {
    this.clearCache();
    return await this.fileStorage.delete(this.fileNode);
  }

  /**
   * Search the file and all of its children recursively based on the query.
   * @async
   * @param {string} query - Words to be searched seperated by spaces.
   * @returns {FileObject[]} - A list of file objects.
   */
  async search(query) {
    let fileObjectList = [];
    let fileNodeList = await this.fileStorage.search(this.fileNode, query);
    for (let node of fileNodeList){
      fileObjectList.push(new FileObject(this.fileStorage, node, node.name, this));
    }
    return fileObjectList;
  }

  toString(){
    return `/${this.path.join('/')}`;
  }
}

export class Link extends FileObject {
  /**
   * A FileObject that links to another file object. The file data is a json string with the
   * path of the file it links to.
   * @param {FileObject} fileObject - The file this links to.
   * @param {string} name - The name of the link
   * @param {FileObject|null} parent - The parent directory for this file. Null if root directory.
   */
  constructor(fileObject, name, parent){
    super(fileObject.fileStorage, fileObject.fileNode, name, parent);
    this._fileObject = fileObject;
  }


  get mimeType() {
    return 'inode/symlink';
  }

  async read(params) {
    return new File([JSON.stringify(this._fileObject.path)], this.name, {type: 'application/json'});
  }
}
