import * as files from "./base";


/**
 * Proxy to an file
 * @property {BasicFile} concreteFile - The file to proxy
 */
export class ProxyFile extends files.BasicFile {
  private _concreteFile : files.File;

  constructor(concreteFile : files.File){
    super();
    this._concreteFile = concreteFile;
  }

  get id() {
    return this._concreteFile.id;
  }

  get name() {
    return this._concreteFile.name;
  }

  get directory() {
    return this._concreteFile.directory;
  }

  get url() {
    return this._concreteFile.url;
  }

  get icon() {
    return this._concreteFile.icon;
  }

  get size() {
    return this._concreteFile.size;
  }

  get mimeType(){
    return this._concreteFile.mimeType;
  }

  get lastModified() {
    return this._concreteFile.lastModified;
  }

  get created() {
    return this._concreteFile.created;
  }

  get extra(){
    return this._concreteFile.extra;
  }

  read(params? : Object) {
    return this._concreteFile.read(params);
  }

  write(data : ArrayBuffer) {
    return this._concreteFile.write(data);
  }

  rename(newName : string) {
    return this._concreteFile.rename(newName);
  }

  delete() {
    return this._concreteFile.delete();
  }
}


/**
 * Proxy to an file
 * @property {Directory} concreteDirectory - The directory to proxy
 */
export class ProxyDirectory extends files.Directory {
  private _concreteDirectory : files.Directory;

  constructor(concreteDirectory : files.Directory){
    super();
    this._concreteDirectory = concreteDirectory;
  }

  get id() {
    return this._concreteDirectory.id;
  }

  get name() {
    return this._concreteDirectory.name;
  }

  get directory() {
    return this._concreteDirectory.directory;
  }

  get url() {
    return this._concreteDirectory.url;
  }

  get icon() {
    return this._concreteDirectory.icon;
  }

  get lastModified() {
    return this._concreteDirectory.lastModified;
  }

  get created() {
    return this._concreteDirectory.created;
  }

  get extra(){
    return this._concreteDirectory.extra;
  }

  rename(newName : string) {
    return this._concreteDirectory.rename(newName);
  }

  delete() {
    return this._concreteDirectory.delete();
  }

  search(query : string) {
    return this._concreteDirectory.search(query);
  }

  addFile(fileData : ArrayBuffer, filename : string, mimeType : string) {
    return this._concreteDirectory.addFile(fileData, filename, mimeType);
  }

  addDirectory(name : string) {
    return this._concreteDirectory.addDirectory(name);
  }

  getFile(pathArray : string[]) {
    return this._concreteDirectory.getFile(pathArray);
  }

  getChildren() {
    return this._concreteDirectory.getChildren();
  }
}
