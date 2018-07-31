import {FileNotFoundError, AbstractFileStorage} from "./base.js";
import {stringToArrayBuffer, copyArrayBuffer} from "../../utils.js";

if (Object.values === undefined){
  // Polyfill for testing with Node versions < 7.0.
  Object.values = (obj) => Object.keys(obj).map(key => obj[key]);
}

class BaseMemoryFile {
  constructor(parent, name, mimeType){
    this._name = name;
    this._mimeType = mimeType;
    this._created = new Date();
    this._lastModified = new Date();
    this.parent = parent;
  }

  static get directory(){
    return false;
  }

  get parent(){
    return this._parent;
  }

  set parent(parent){
    if (this._parent){
      this._parent.removeChild(this.name);
    }
    if (parent !== null){
      parent.addChild(this);
    }
    this._parent = parent
  }

  get mimeType(){
    return this._mimeType || 'application/octet-stream';
  }

  get id(){
    if (this.parent === null){
      // Root directory
      return "";
    }
    return this.parent.id + '/' + this.name;
  }

  get name(){
    return this._name;
  }

  get icon(){
    return null;
  }

  get url(){
    return "";
  }

  get created(){
    return this._created.toISOString();
  }

  get lastModified(){
    return this._lastModified.toISOString();
  }

  /**
   * @abstract
   * @returns ArrayBuffer
   */
  get fileData(){
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @returns int
   */
  get size(){
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   */
  get children(){
    throw new Error("Not implemented");
  }

  get fileNode(){
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      directory: this.constructor.directory,
      icon: this.icon,
      size: this.size,
      mimeType: this.mimeType,
      lastModified: this.lastModified,
      created: this.created
    };
  }

  rename(name){
    this.parent.removeChild(this.name);
    this._name = name;
    this.parent.addChild(this.name);
  }
}

class MemoryFile extends BaseMemoryFile {
  constructor(parent, name, fileData, mimeType) {
    super(parent, name, mimeType);

    if (!(fileData instanceof ArrayBuffer)){
      throw new Error(`File data must be an ArrayBuffer not ${typeof fileData}.`);
    }
    this._fileData = fileData;
  }

  get fileData(){
    return this._fileData;
  }

  set fileData(data){
    this._fileData = data;
    this._lastModified = new Date();
  }

  get size(){
    return this._fileData.size;
  }

  get lastModified(){
    return this._lastModified.toISOString();
  }

  get children(){
    return {};
  }
}

class MemoryDirectory extends BaseMemoryFile {
  constructor(parent, name){
    super(parent, name, 'application/json');
    this._children = {};
  }

  static get directory(){
    return true;
  }

  get fileData(){
    let nodes = {};
    for (let name in this._children){
      nodes[name] = this._children[name].fileNode;
    }
    return stringToArrayBuffer(JSON.stringify(nodes));
  }

  get size(){
    let size = 0;
    for (let child of Object.values(this._children)){
      size += child.size;
    }
    return size;
  }

  get lastModified(){
    let children = Object.values(this._children);
    if (children.length === 0){
      return this.created;
    }
    return new Date(Math.max.apply(null, Object.values(this._children).map(function(e) {
      return new Date(e.lastModified);
    }))).toISOString();
  }

  get children(){
    return this._children;
  }

  addChild(memoryFile){
    this._children[memoryFile.name] = memoryFile;
  }

  removeChild(name){
    delete this._children[name];
  }
}

/**
 * A storage class that stores file temporary in memory on the client.
 * @extends AbstractFileStorage
 */
export class MemoryFileStorage extends AbstractFileStorage {
  constructor(){
    super();

    this._root = new MemoryDirectory(null, 'root');
  }

  async getRootFileNode(){
    return this._root.fileNode;
  }

  async readFileNode(id, params) {
    let memoryFile = this._getFile(id);
    return memoryFile.fileData;
  }


  _stringToPathArray(stringPath){
    stringPath = stringPath.trim();
    if (stringPath === ""){
      return [];
    }
    return stringPath.split('/');
  }

  _normalizePath(path){
    let pathArray = this._stringToPathArray(path);
    let normalizedPathArray = [];
    for (let segement of pathArray){
      if (segement.trim() !== ""){
        normalizedPathArray.push(segement.toString());
      }
    }
    return normalizedPathArray.join('/');
  }

  _getFile(path){
    path = this._normalizePath(path);
    let pathArray = this._stringToPathArray(path);
    let memoryFile = this._root;
    let index = 0;
    while (index < pathArray.length){
      let segment = pathArray[index];
      if (segment){
        memoryFile = memoryFile.children[segment];
        if (memoryFile === undefined){
          throw new FileNotFoundError(`File not found at ${path}.`);
        }
      }
      index ++;
    }
    return memoryFile;
  }

  async addFile(id, fileData, filename, mimeType){
    let parent = this._getFile(id);
    let newMemoryFile = new MemoryFile(parent, filename, fileData, mimeType);
    return newMemoryFile.fileNode;
  }

  async writeFileNode(id, data) {
    let memoryFile = this._getFile(id);
    memoryFile.fileData = data;
    return memoryFile.fileNode;
  }

  async addDirectory(parentId, name) {
    let parent = this._getFile(parentId);
    let newMemoryDirectory = new MemoryDirectory(parent, name);
    return newMemoryDirectory.fileNode;
  }

  async rename(id, newName) {
    let memoryFile = this._getFile(id);
    memoryFile.rename(newName);
  }

  async delete(id) {
    let memoryFile = this._getFile(id);
    let parent = memoryFile.parent;
    parent.removeChild(memoryFile.name);
  }

  async copy(sourceId, targetParentId) {
    let sourceMemoryFile = this._getFile(sourceId);
    let targetMemoryFile = this._getFile(targetParentId);
    if (sourceMemoryFile.directory){
      new MemoryDirectory(targetMemoryFile, sourceMemoryFile.name);
    } else {
      new MemoryFile(targetMemoryFile, sourceMemoryFile.name,
                     copyArrayBuffer(sourceMemoryFile.fileData), sourceMemoryFile.mimeType);
    }
  }

  async move(sourceId, targetParentId) {
    let sourceMemoryFile = this._getFile(sourceId);
    sourceMemoryFile.parent = this._getFile(targetParentId);
  }

  async search(id, query) {
    throw new Error("Not implemented")
  }

  clone() {
    throw new Error("Not implemented")
  };
}
