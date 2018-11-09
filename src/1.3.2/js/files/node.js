import {AbstractFile} from "./base.js";
import * as fs from 'fs';
import * as path from 'path';
import {DirectoryMixin} from "./base";

function nodeFSFuncAsyncWrapper(func) {
  return async (...args) => {
    return await new Promise((resolve, reject) => {
      let callback = (err, stats) => {
        if (err) {
          reject(err)
        } else {
          resolve(stats);
        }
      };
      args.push(callback);
      func(...args);
    })
  }
}


class AbstractNodeFileBase extends AbstractFile {
  constructor(path, stat) {
    super();
    this._path = path;
    this._stat = stat || fs.statSync(path);

    this.stat = nodeFSFuncAsyncWrapper(fs.stat);
    this.readFile = nodeFSFuncAsyncWrapper(fs.readFile);
    this.writeFile = nodeFSFuncAsyncWrapper(fs.writeFile);
    this.readdir = nodeFSFuncAsyncWrapper(fs.readdir);
    this.appendFile = nodeFSFuncAsyncWrapper(fs.appendFile);
    this.mkdir = nodeFSFuncAsyncWrapper(fs.mkdir);
    this.fsrename = nodeFSFuncAsyncWrapper(fs.rename);
    this.unlink = nodeFSFuncAsyncWrapper(fs.unlink);
  }

  static get preservesMimeType(){
    return false;
  }

  get id() {
    return this._path;
  }

  get name() {
    return path.basename(this._path);
  }

  get url() {
    return null;
  }

  get icon() {
    return null;
  }

  get size() {
    return this._stat.size;
  }

  get lastModified() {
    return this._stat.birthtime;
  }

  get created() {
    return this._stat.ctime;
  }

  async rename(newName) {
    let dirName = path.dirname(this.id);
    await this.fsrename(this.id, path.join(dirName, newName));
  }

  async delete() {
    await this.unlink(this.id);
  }

  async copy(targetParentId) {
    throw new Error("Not implemented")
  }

  async move(targetParentId) {
    throw new Error("Not implemented")
  }

  async search(query) {
    throw new Error("Not implemented")
  }
}


/**
 * A file on the local system using NodeJS file operations.
 */
export class NodeFile extends AbstractNodeFileBase {
  get mimeType() {
    return 'application/octet-stream';
  }

  async read(params) {
    let typedArray = await this.readFile(this.id);
    return typedArray.buffer;
  }

  async write(data) {
    await this.writeFile(this.id, new Buffer.from(data));
    return await this.readFile(this.id);
  }
}

export class NodeDirectory extends DirectoryMixin(NodeFile) {
  async addFile(fileData, filename, type) {
    if (!(fileData instanceof ArrayBuffer)) {
      throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`)
    }
    let filePath = path.join(this.id, filename);
    await this.appendFile(filePath, new Buffer.from(fileData));
    let stat = await this.stat(filePath);
    return new NodeFile(filePath, stat);
  }

  async addDirectory(name) {
    let dirPath = path.join(this.id, name);
    await this.mkdir(dirPath, null);
    let stat = await this.stat(dirPath);
    return new NodeDirectory(dirPath, stat);
  }

  async getChildren(){
    let children = [];
    let nameArray = await this.readdir(this.id);
    for (let name of nameArray) {
      let childPath = path.join(this.id, name);
      let stat = await this.stat(childPath);
      if (stat.isDirectory()){
        children.push(new NodeDirectory(childPath, stat));
      } else {
        children.push(new NodeFile(childPath, stat));
      }
    }
    return children;
  }
}