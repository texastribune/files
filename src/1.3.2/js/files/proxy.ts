import * as files from "./base";
import {Directory} from "./base";


/**
 * Proxy to an file
 */
export class ProxyFile extends files.BasicFile {
  private readonly concreteFile : files.File;

  constructor(concreteFile : files.File){
    super();
    this.concreteFile = concreteFile;
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

  addOnChangeListener(listener: (file: files.File) => void) {
    this.concreteFile.addOnChangeListener(listener);
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
}


/**
 * Proxy to an file
 * @property {Directory} concreteDirectory - The directory to proxy
 */
export class ProxyDirectory extends files.Directory {
  private readonly concreteDirectory : files.Directory;

  constructor(concreteDirectory : files.Directory){
    super();
    this.concreteDirectory = concreteDirectory;
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

  onChange() {
    this.concreteDirectory.onChange();
  }

  addOnChangeListener(listener: (file: files.File) => void) {
    this.concreteDirectory.addOnChangeListener(listener);
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


export class ChangeEventProxyFile extends ProxyFile {
  async write(data : ArrayBuffer) {
    let ret = await super.write(data);
    this.onChange();
    return ret;
  }

  async rename(newName : string) {
    let ret = await super.rename(newName);
    this.onChange();
    return ret;
  }

  async delete() {
    await super.delete();
    this.onChange();
  }
}

export class ChangeEventProxyDirectory extends ProxyDirectory {
  async rename(newName : string) {
    let ret = await super.rename(newName);
    this.onChange();
    return ret;
  }

  async delete() {
    await super.delete();
    this.onChange();
  }


  async addFile(fileData: ArrayBuffer, filename: string, mimeType: string): Promise<files.File> {
    let ret = super.addFile(fileData, filename, mimeType);
    this.onChange();
    return ret;
  }

  async addDirectory(name: string): Promise<files.Directory> {
    let ret = super.addDirectory(name);
    this.onChange();
    return ret;
  }

  async getChildren(): Promise<files.File[]> {
    let children = [];
    for (let child of await super.getChildren()){
      if (child instanceof files.Directory){
        child = new ChangeEventProxyDirectory(child);
      } else {
        child = new ChangeEventProxyFile(child);
      }
      child.addOnChangeListener(() => {
        this.onChange();
      });
      children.push(child);
    }
    return children;
  }
}

export class CachedProxyDirectory extends ChangeEventProxyDirectory {
  private cachedChildren : files.File[] | null = null;
  private readonly parent : CachedProxyDirectory | null;

  constructor(concreteDirectory : files.Directory, parentDirectory? : CachedProxyDirectory){
    super(concreteDirectory);
    this.parent = parentDirectory || null;
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

  async getChildren() {
    if (this.cachedChildren === null){
      let newChildren = [];
      for (let child of await super.getChildren()){
        if (child instanceof files.Directory){
          child = new CachedProxyDirectory(child, this);
        }
        newChildren.push(child);
      }
      this.cachedChildren = newChildren;
    }
    return this.cachedChildren.slice();
  }

  clearCache(){
    this.cachedChildren = null;
  }
}
