import {AbstractDirectory, AbstractFile} from "./base.js";


/**
 * Proxy to an file
 * @property {AbstractFile} concreteFile - The file to proxy
 */
export class ProxyFile extends AbstractFile {
  constructor(concreteFile){
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

  getParent() {
    return this._concreteFile.getParent();
  }

  read(params) {
    return this._concreteFile.read(params);
  }

  write(data) {
    return this._concreteFile.write(data);
  }

  rename(newName) {
    return this._concreteFile.rename(newName);
  }

  copy(targetDirectory) {
    return this._concreteFile.copy(targetDirectory);
  }

  move(targetDirectory) {
    return this._concreteFile.move(targetDirectory);
  }

  delete() {
    return this._concreteFile.delete();
  }

  search(query) {
    return this._concreteFile.search(query);
  }

  addFile(fileData, filename, mimeType) {
    return this._concreteFile.addFile(fileData, filename, mimeType);
  }

  addDirectory(name) {
    return this._concreteFile.addDirectory(name);
  }


  getFile(pathArray) {
    return this._concreteFile.getFile();
  }


  getChildren() {
    return this._concreteFile.getChildren();
  }
}


/**
 * Proxy to an file
 * @property {AbstractDirectory} concreteDirectory - The directory to proxy
 */
export class ProxyDirectory extends AbstractDirectory {
  constructor(concreteDirectory){
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

  getParent() {
    return this._concreteDirectory.getParent();
  }

  rename(newName) {
    return this._concreteDirectory.rename(newName);
  }

  copy(targetDirectory) {
    return this._concreteDirectory.copy(targetDirectory);
  }

  move(targetDirectory) {
    return this._concreteDirectory.move(targetDirectory);
  }

  delete() {
    return this._concreteDirectory.delete();
  }

  search(query) {
    return this._concreteDirectory.search(query);
  }

  addFile(fileData, filename, mimeType) {
    return this._concreteDirectory.addFile(fileData, filename, mimeType);
  }

  addDirectory(name) {
    return this._concreteDirectory.addDirectory(name);
  }

  getFile(pathArray) {
    return this._concreteDirectory.getFile();
  }

  getChildren() {
    return this._concreteDirectory.getChildren();
  }
}
