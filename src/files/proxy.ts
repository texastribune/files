import * as files from "./base.js";
import {Directory, FileNotFoundError} from "./base.js";


/**
 * Proxy to a file
 */
export class ProxyFile<T extends files.File> extends files.BasicFile {
  private readonly concreteFile : T;

  constructor(concreteFile : T){
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
export class ProxyDirectory<T extends Directory> extends files.Directory {
  readonly concreteDirectory : T;

  constructor(concreteDirectory : T){
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

  copy(targetDirectory : Directory){
    return this.concreteDirectory.copy(targetDirectory);
  };

  move(targetDirectory : Directory){
    return this.concreteDirectory.move(targetDirectory);
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

  getFile(pathArray: string[]) {
    return this.concreteDirectory.getFile(pathArray);
  }

  getChildren() {
    return this.concreteDirectory.getChildren();
  }
}


/**
 * Fires change event for local file changes such as write, rename, delete, etc.
 */
export class ChangeEventProxyFile<T extends files.File> extends ProxyFile<T> {
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

  async delete(): Promise<void> {
    let ret = await super.delete();
    this.dispatchChangeEvent();
    return ret;
  }
}


/**
 * Fires change event for local file changes such as rename, delete, etc. as well as
 * when those changes happen on children of the directory.
 */
export class ChangeEventProxyDirectory<T extends files.Directory> extends ProxyDirectory<T> {

  protected constructor(concreteDirectory : T){
    super(concreteDirectory);
  }

  async rename(newName : string) {
    let ret = await super.rename(newName);
    this.dispatchChangeEvent();
    return ret;
  }

  async delete(): Promise<void> {
    let ret = await super.delete();
    this.dispatchChangeEvent();
    return ret;
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

  async getFile(pathArray: string[]): Promise<files.File> {
    let child =  await super.getFile(pathArray);
    child.addOnChangeListener(() => {
      this.dispatchChangeEvent();
    });
    return child;
  }

  async getChildren(): Promise<files.File[]> {
    let children = [];
    for (let child of await super.getChildren()){
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
export class CachedProxyDirectory<T extends files.Directory> extends ChangeEventProxyDirectory<T> {
  protected readonly parent : CachedProxyDirectory<T> | null;
  private cachedChildren : files.File[] | null = null;

  constructor(concreteDirectory : T, parentDirectory? : CachedProxyDirectory<T>){
    super(concreteDirectory);
    this.parent = parentDirectory || null;
  }

  dispatchChangeEvent() {
    this.clearCache();
    super.dispatchChangeEvent();
  }

  get root() : CachedProxyDirectory<T> {
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

  protected createFile(child : files.File, parent : CachedProxyDirectory<files.Directory>) : CachedProxyDirectory<files.Directory> | ChangeEventProxyFile<files.File> {
    if (child instanceof files.Directory){
      return new CachedProxyDirectory(child, parent);
    } else {
      return new ChangeEventProxyFile(child);
    }
  }

  async getFile(pathArray: string[]): Promise<CachedProxyDirectory<files.Directory> | ChangeEventProxyFile<files.File>> {
    if (pathArray.length === 0){
      return this;
    }
    else if (pathArray.length === 1 && this.cachedChildren !== null){
      for (let child of this.cachedChildren){
        if (child.name === pathArray[0]){
          return this.createFile(child, this);
        }
      }
    }
    let parent = await this.getFile(pathArray.slice(0, pathArray.length-1));
    if (!(parent instanceof CachedProxyDirectory)){
      throw new FileNotFoundError(`${parent.name} is not a directory`)
    }
    let file = await super.getFile(pathArray);
    return this.createFile(file, parent);
  }

  async getChildren() {
    if (this.cachedChildren === null){
      this.cachedChildren = [];
      for (let child of await super.getChildren()){
        this.cachedChildren.push(this.createFile(child, this));
      }
    }
    return this.cachedChildren.slice();
  }

  clearCache(){
    this.cachedChildren = null;
  }
}
