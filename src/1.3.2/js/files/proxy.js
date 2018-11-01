import {AbstractDirectory, AbstractFile} from "./base";


export class ProxyFile extends AbstractFile {
  constructor(concreteFile){
    super();
    this._concreteFile = concreteFile;
  }

  get parent() {
    return this._concreteFile._parent;
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

  async read(params) {
    return await this._concreteFile.read(params);
  }

  async write(data) {
    return await this._concreteFile.write(data);
  }

  async rename(newName) {
    await this._concreteFile.rename(newName);
  }

  async copy(targetDirectory) {
    await this._concreteFile.copy(targetDirectory);
  }

  async move(targetDirectory) {
    await this._concreteFile.move(targetDirectory);
  }

  async delete() {
    await this._concreteFile.delete();
  }

  async search(query) {
    return await this._concreteFile.search(query);
  }

  async addFile(fileData, filename, mimeType) {
    return await this._concreteFile.addFile(fileData, filename, mimeType);
  }

  async addDirectory(name) {
    return await this._concreteFile.addDirectory(name);
  }


  async getFile(pathArray) {
    return await this._concreteFile.getFile();
  }


  async getChildren() {
    return await this._concreteFile.getChildren();
  }

  createChild(metadata){
    return this._concreteFile.createChild(metadata);
  }
}

export class ProxyDirectory extends AbstractDirectory {
  constructor(concreteFile){
    super();
    this._concreteFile = concreteFile;
  }

  get parent() {
    return this._concreteFile._parent;
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

  get lastModified() {
    return this._concreteFile.lastModified;
  }

  get created() {
    return this._concreteFile.created;
  }

  async rename(newName) {
    await this._concreteFile.rename(newName);
  }

  async copy(targetDirectory) {
    await this._concreteFile.copy(targetDirectory);
  }

  async move(targetDirectory) {
    await this._concreteFile.move(targetDirectory);
  }

  async delete() {
    await this._concreteFile.delete();
  }

  async search(query) {
    return await this._concreteFile.search(query);
  }

  async addFile(fileData, filename, mimeType) {
    return await this._concreteFile.addFile(fileData, filename, mimeType);
  }

  async addDirectory(name) {
    return await this._concreteFile.addDirectory(name);
  }

  async getFile(pathArray) {
    return await this._concreteFile.getFile();
  }

  async getChildren() {
    return await this._concreteFile.getChildren();
  }
}
