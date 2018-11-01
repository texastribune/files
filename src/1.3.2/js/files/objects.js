
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


export class File{
  /**
   * An object representing a file or directory in a file system. Provides API for
   * performing operations on the file.
   * @param {AbstractFileSystem} fileSystem - The file system the file is on
   * @param {FileNode} fileNode - The FileNode object representing the file
   */
  constructor(fileSystem, fileNode) {
    this._fileStorage = fileSystem;
    this._fileNode = fileNode;
    this._name = name;
    this._parent = parent;
    this._filePromiseCache = null;
  }

  // Getters
  get fileSystem() {
    return this._fileStorage;
  }

  get id() {
    return this._fileNode.id;
  }

  get name() {
    return this._fileNode.name;
  }

  get url() {
    return this._fileNode.url;
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
      this._filePromiseCache = this.fileSystem.readFile(this.id, params);
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
    return await this.fileSystem.writeFile(this.id, data);
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
    await this.fileSystem.rename(this.id, newName);
    this._fileNode.name = newName;
  }

  /**
   * Delete the file from its storage location.
   * @async
   */
  async delete() {
    this.clearCache();
    return await this.fileSystem.delete(this.id);
  }

  /**
   * Search the file and all of its children recursively based on the query.
   * @async
   * @param {string} query - Words to be searched seperated by spaces.
   * @returns {File[]} - A list of file objects.
   */
  async search(query) {
    let fileObjectList = [];
    let fileNodeList = await this.fileSystem.search(this.id, query);
    for (let node of fileNodeList){
      fileObjectList.push(new FileObject(this.fileSystem, node, node.name, this));
    }
    return fileObjectList;
  }

  toString(){
    return `/${this.path.join('/')}`;
  }
}

export class Directory extends File {
  constructor(fileSystem, fileNode){
    super(fileSystem, fileNode);
  }

  static get mimeType(){
    return 'application/json';
  }

  get mimeType() {
    return Directory.mimeType;
  }

  async read(params) {
    return
  }

  async search(query) {
    return await this.fileSystem.search(this.id, query);
  }

  async addFile(fileData, filename, mimeType) {
    return await this.fileSystem.addFile(this.id, fileData, filename, mimeType);
  }

  async addDirectory(name) {
    return await this.fileSystem.addDirectory(this.id, name);
  }

  async getChildren() {
      let childrenMeta = await this.fileSystem.readJSON();
      let fileObjects = [];
      for (let childMeta of childrenMeta) {
        if (childMeta.directory){
          fileObjects.push(new Directory(this.fileSystem, childMeta));
        } else {
          fileObjects.push(new File(this.fileSystem, childMeta));
        }
      }
      return fileObjects;
  }
}