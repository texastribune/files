import {AbstractFile} from "../files/base.js";
import {stringToArrayBuffer} from "../utils";
import {ProxyFile} from "../files/proxy.js";
import {ProxyDirectory} from "../files/proxy";
import {AbstractDirectory} from "../files/base";
import LZString from "../lz-string-1.4.4/lz-string";

class VirtualFile extends ProxyFile {
    constructor(concreteFile, virtualRoot, parent){
        super(concreteFile);
        this._virtualRoot = virtualRoot;
        this._parent = parent;
    }

    get parent(){
        return this._parent;
    }

    // get id(){
    //   let jsonString = JSON.stringify([this._mountPoint.id, this.id]);
    //   return LZString.compressToUTF16(jsonString);
    // }
}

class VirtualDirectory extends ProxyDirectory {
    constructor(concreteFile, parent){
        super(concreteFile);
        this._parent = parent;
    }

    get parent(){
        return this._parent;
    }

    async getChildren(){
        let children = await super.getChildren();
        let virtualChildren = [];
        for (let child of children){
            virtualChildren.push(this.root._mounts[child.id] || child);
        }
    }
}

class VirtualRootDirectory extends VirtualDirectory {
  constructor(){
    super();
    this._created = new Date();
    this._lastModified = new Date();

    this._mounts = {};
  }

  get parent(){
    return null;
  }

  get id() {
    return 'root';
  }

  get name() {
    return 'root';
  }

  get icon() {
    return null;
  }

  get created() {
    return this._created;
  }

  get lastModified(){
    return this._lastModified;
  }

  async rename(newName) {
    throw new Error("Cannot rename root file.");
  }

  async copy(targetDirectory) {
    super.copy(targetDirectory);
  }

  async move(targetDirectory) {
    throw new Error("Cannot move root file.");
  }

  async delete() {
    throw new Error("Cannot delete root file.");
  }

  async search(query) {
    throw new Error("Cannot search root file.");
  }

  async addFile(fileData, filename, mimeType) {
    throw new Error("Cannot add file to root file.");
  }

  async addDirectory(name) {
    throw new Error("Cannot add directory to root file.");
  }

  async mount(mountPoint, file) {
    this._mounts[mountPoint.id] =  file;
  }
}
