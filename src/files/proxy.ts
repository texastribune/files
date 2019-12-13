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
    this.concreteDirectory.addOnChangeListener(this.dispatchChangeEvent);
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
 * Caches the children of the directory for when getChildren is called. Listens for change events
 * to invalidate the cache.
 */
export class CachedProxyDirectoryBase<T extends files.Directory> extends ProxyDirectory<T> {
  private readonly cachedRoot : CachedProxyDirectory<T> | null;
  protected readonly parentPath : string[];
  private pathCache : {[encodedPath: string]: CachableFile} = {};
  private childCache : CachableFile[] | null = null;


  protected constructor(concreteDirectory : T, parentPath : string[], rootDirectory : CachedProxyDirectory<T> | null){
    super(concreteDirectory);
    this.cachedRoot = rootDirectory;
    this.parentPath = parentPath;

    if (this.cachedRoot !== null){
      this.cachedRoot.add(this.parentPath.concat([this.name]), this);
    }

    this.addOnChangeListener(this.clearCache);
  }

  get root() : CachedProxyDirectory<T> {
    if (this.cachedRoot === null){
      return this
    }
    return this.cachedRoot;
  }

  get path() : string[] {
    return this.parentPath.concat([this.name]);
  }

  protected createDescendant(file : files.File, parentPath : string[]) : CachableFile {
    let f : CachableFile;
    if (file instanceof files.Directory){
      return new CachedProxyDirectory(file, parentPath, this.root);
    } else {
      return new ChangeEventProxyFile(file);
    }
  }

  async getFile(pathArray: string[]): Promise<CachableFile> {
    if (pathArray.length === 0){
      return this;
    }
    let absolutePath = this.path.concat(pathArray);
    let cached = this.root.getCached(absolutePath);
    if (cached !== null){
      return cached;
    }
    let file = await super.getFile(pathArray);
    return this.createDescendant(file, absolutePath.slice(0, absolutePath.length-1));
  }

  async getChildren(): Promise<CachableFile[]> {
    if (this.childCache === null){
      let children = await super.getChildren();
      this.childCache = [];
      for (let child of children){
        let cachedChild = this.createDescendant(child, this.path);
        this.childCache.push(cachedChild);
      }
    }
    return this.childCache.slice();
  }

  async addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File> {
    let f = await super.addFile(fileData, filename, mimeType);
    return new ChangeEventProxyFile(f);
  }

  async addDirectory(name: string): Promise<files.Directory> {
    let f = await super.addDirectory(name);
    return new CachedProxyDirectory(f, this.path, this.root);
  }

  add(absolutePath : string[], file : CachableFile) {
    if (this.cachedRoot === null){
      let key = absolutePath.map(encodeURIComponent).join('/');
      this.pathCache[key] = file;
    } else {
      this.cachedRoot.add(absolutePath, file);
    }
  }

  getCached(absolutePath : string[]) : CachableFile | null {
    if (this.cachedRoot === null){
      let key = absolutePath.map(encodeURIComponent).join('/');
      return this.pathCache[key] || null;
    } else {
      return this.cachedRoot.getCached(absolutePath);
    }
  }

  clearCache() {
    this.childCache = null;
    if (this.cachedRoot === null){
      this.pathCache = {};
    } else {
      this.cachedRoot.clearCache();
    }
  }
}


type CachableFile = CachedProxyDirectory<files.Directory> | ChangeEventProxyFile<files.File>;


export class CachedProxyDirectory<T extends files.Directory> extends CachedProxyDirectoryBase<T> {
  constructor(concreteDirectory : T, parentPath : string[], rootDirectory : CachedProxyDirectory<T>) {
    super(concreteDirectory, parentPath, rootDirectory);
  }
}

export class CachedProxyRootDirectory<T extends files.Directory> extends CachedProxyDirectoryBase<T> {
  constructor(concreteDirectory : T) {
    super(concreteDirectory, [], null);
  }
}
