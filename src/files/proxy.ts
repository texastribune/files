import * as files from "./base";
import {Directory} from "./base";


/**
 * Proxy to a file
 */
export class ProxyFile extends files.BasicFile {
  private readonly concreteFile : files.File;

  constructor(concreteFile : files.File){
    super();
    this.concreteFile = concreteFile;
    this.concreteFile.addOnChangeListener(() =>{
      this.dispatchChangeEvent();
    });
  }

  get id() {
    return this.concreteFile.id;
  }

  get name() {
    return this.concreteFile.name;
  }

  get directory() {
    return this.concreteFile.directory;
  }

  get url() {
    return this.concreteFile.url;
  }

  get icon() {
    return this.concreteFile.icon;
  }

  get size() {
    return this.concreteFile.size;
  }

  get mimeType(){
    return this.concreteFile.mimeType;
  }

  get lastModified() {
    return this.concreteFile.lastModified;
  }

  get created() {
    return this.concreteFile.created;
  }

  get extra(){
    return this.concreteFile.extra;
  }

  read() {
    return this.concreteFile.read();
  }

  write(data : ArrayBuffer) {
    return this.concreteFile.write(data);
  }

  rename(newName : string) {
    return this.concreteFile.rename(newName);
  }

  delete() {
    return this.concreteFile.delete();
  }

  copy(targetDirectory : Directory){
    return this.concreteFile.copy(targetDirectory);
  };

  move(targetDirectory : Directory){
    return this.concreteFile.move(targetDirectory);
  }
}


/**
 * Proxy to a directory
 * @property {Directory} concreteDirectory - The directory to proxy
 */
export class ProxyDirectory extends files.Directory {
  readonly concreteDirectory : files.Directory;

  constructor(concreteDirectory : files.Directory){
    super();
    this.concreteDirectory = concreteDirectory;
    this.concreteDirectory.addOnChangeListener(() =>{
      this.dispatchChangeEvent();
    });
  }

  get id() {
    return this.concreteDirectory.id;
  }

  get name() {
    return this.concreteDirectory.name;
  }

  get directory() {
    return this.concreteDirectory.directory;
  }

  get url() {
    return this.concreteDirectory.url;
  }

  get icon() {
    return this.concreteDirectory.icon;
  }

  get lastModified() {
    return this.concreteDirectory.lastModified;
  }

  get created() {
    return this.concreteDirectory.created;
  }

  get extra(){
    return this.concreteDirectory.extra;
  }

  rename(newName : string) {
    return this.concreteDirectory.rename(newName);
  }

  delete() {
    return this.concreteDirectory.delete();
  }

  search(query : string) {
    return this.concreteDirectory.search(query);
  }

  addFile(fileData : ArrayBuffer, filename : string, mimeType : string) {
    return this.concreteDirectory.addFile(fileData, filename, mimeType);
  }

  addDirectory(name : string) {
    return this.concreteDirectory.addDirectory(name);
  }

  getChildren() {
    return this.concreteDirectory.getChildren();
  }
}


/**
 * Fires change event for local file changes such as write, rename, delete, etc.
 */
export class ChangeEventProxyFile extends ProxyFile {
  async write(data : ArrayBuffer) {
    let ret = await super.write(data);
    this.dispatchChangeEvent();
    return ret;
  }

  async rename(newName : string) {
    let ret = await super.rename(newName);
    this.dispatchChangeEvent();
    return ret;
  }

  async delete() {
    await super.delete();
    this.dispatchChangeEvent();
  }
}


/**
 * Fires change event for local file changes such as rename, delete, etc. as well as
 * when those changes happen on children of the directory.
 */
export class ChangeEventProxyDirectory extends ProxyDirectory {
  async rename(newName : string) {
    let ret = await super.rename(newName);
    this.dispatchChangeEvent();
    return ret;
  }

  async delete() {
    await super.delete();
    this.dispatchChangeEvent();
  }

  async addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File> {
    let ret = await super.addFile(fileData, filename, mimeType);
    this.dispatchChangeEvent();
    return ret;
  }

  async addDirectory(name: string): Promise<files.Directory> {
    let ret = await super.addDirectory(name);
    this.dispatchChangeEvent();
    return ret;
  }

  createChild(child : files.File){
    if (child instanceof files.Directory){
      return new ChangeEventProxyDirectory(child);
    } else {
      return new ChangeEventProxyFile(child);
    }
  }

  async getChildren(): Promise<files.File[]> {
    let children = [];
    for (let child of await super.getChildren()){
      child = this.createChild(child);
      child.addOnChangeListener(() => {
        this.dispatchChangeEvent();
      });
      children.push(child);
    }
    return children;
  }
}

/**
 * Caches the children of the directory for when getChildren is called. Listens for change events
 * to invalidate the cache.
 */
export class CachedProxyDirectory extends ChangeEventProxyDirectory {
  private cachedChildren : files.File[] | null = null;
  private readonly parent : CachedProxyDirectory | null;

  constructor(concreteDirectory : files.Directory, parentDirectory? : CachedProxyDirectory){
    super(concreteDirectory);
    this.parent = parentDirectory || null;
  }

  dispatchChangeEvent() {
    this.clearCache();
    super.dispatchChangeEvent();
  }

  get root() : files.Directory {
    if (this.parent === null){
      return this;
    }
    return this.parent.root;
  }

  get path() : files.Directory[] {
    if (this.parent === null){
      return [this];
    }
    return this.parent.path.concat([this]);
  }

  createChild(child : files.File){
    if (child instanceof files.Directory){
      return new CachedProxyDirectory(child, this);
    } else {
      return new ChangeEventProxyFile(child);
    }
  }

  async getChildren() {
    if (this.cachedChildren === null){
      this.cachedChildren = await super.getChildren();
    }
    return this.cachedChildren.slice();
  }

  clearCache(){
    this.cachedChildren = null;
  }
}
