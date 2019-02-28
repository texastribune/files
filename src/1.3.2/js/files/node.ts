import * as files from "./base";
import {statSync, Stats} from "fs";
import {promises as fs} from "fs";
import * as path from 'path';


/**
 * A file on the local system using NodeJS file operations.
 */
export class NodeFile extends files.BasicFile {
  private stat : Stats;
  private path : string;
  public extra = {};

  constructor(path : string, stat? : Stats) {
    super();
    this.path = path;
    this.stat = stat || statSync(path);
  }

  get id() {
    return this.path;
  }

  get name() {
    return path.basename(this.path);
  }

  get url() {
    return null;
  }

  get icon() {
    return null;
  }

  get size() {
    return this.stat.size;
  }

  get lastModified() {
    return this.stat.birthtime;
  }

  get created() {
    return this.stat.ctime;
  }

  get mimeType() {
    return 'application/octet-stream';
  }

  async rename(newName : string) {
    let dirName = path.dirname(this.id);
    let newPath = path.join(dirName, newName);
    await fs.rename(this.id, newPath);
    this.path = newPath;
  }

  async delete() {
    await fs.unlink(this.id);
  }

  async copy(targetDirectory : files.Directory) {
    throw new Error("Not implemented")
  }

  async move(targetDirectory : files.Directory) {
    throw new Error("Not implemented")
  }

  async search(query : string) {
    throw new Error("Not implemented")
  }

  async read(params? : Object) {
    let typedArray = await fs.readFile(this.id);
    return typedArray.buffer;
  }

  async write(data : ArrayBuffer) {
    await fs.writeFile(this.id, new Buffer.from(data));
    return await fs.readFile(this.id);
  }
}

export class NodeDirectory extends files.Directory {
  private stat : Stats;
  private path : string;
  public extra = {};

  constructor(path : string, stat? : Stats) {
    super();
    this.path = path;
    this.stat = stat || statSync(path);
  }

  get id() {
    return this.path;
  }

  get name() {
    return path.basename(this.path);
  }

  get icon() {
    return null;
  }

  get lastModified() {
    return this.stat.birthtime;
  }

  get created() {
    return this.stat.ctime;
  }

  async rename(newName : string) {
    let dirName = path.dirname(this.id);
    let newPath = path.join(dirName, newName);
    await fs.rename(this.id, newPath);
    this.path = newPath;
  }

  async delete() {
    await fs.unlink(this.id);
  }

  async copy(targetDirectory : files.Directory) {
    throw new Error("Not implemented")
  }

  async move(targetDirectory : files.Directory) {
    throw new Error("Not implemented")
  }

  async search(query : string) : Promise<files.File[]> {
    throw new Error("Not implemented")
  }

  async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string) {
    if (!(fileData instanceof ArrayBuffer)) {
      throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`)
    }
    let filePath = path.join(this.id, filename);
    await fs.appendFile(filePath, new Buffer.from(fileData));
    let stat = await fs.stat(filePath);
    return new NodeFile(filePath, stat);
  }

  async addDirectory(name : string) {
    let dirPath = path.join(this.id, name);
    await fs.mkdir(dirPath, null);
    let stat = await fs.stat(dirPath);
    return new NodeDirectory(dirPath, stat);
  }

  async getChildren() : Promise<files.File[]> {
    let children : files.File[] = [];
    let nameArray = await fs.readdir(this.id);
    for (let name of nameArray) {
      let childPath = path.join(this.id, name);
      let stat = await fs.stat(childPath);
      if (stat.isDirectory()){
        children.push(new NodeDirectory(childPath, stat));
      } else {
        children.push(new NodeFile(childPath, stat));
      }
    }
    return children;
  }
}