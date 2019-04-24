import * as files from "./base";
import {statSync, Stats, watch, FSWatcher, existsSync} from "fs";
import {promises as fs} from "fs";
import * as path from 'path';
import {FileAlreadyExistsError} from "./base";
import {parseTextArrayBuffer} from "../utils";


/**
 * A file on the local system using NodeJS file operations.
 */
export class NodeFile extends files.BasicFile {
  private stat : Stats;
  private path : string;
  private watcher : FSWatcher;

  public extra = {};

  constructor(path : string, stat? : Stats) {
    super();
    this.path = path;
    this.stat = stat || statSync(path);

    this.watcher = watch(this.path, () => {
      this.dispatchChangeEvent();
    });
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

    this.watcher.close();
    this.watcher = watch(this.path, () => {
      this.dispatchChangeEvent();
    });
  }

  async delete() {
    this.watcher.close();
    await fs.unlink(this.id);
  }

  async search(query : string) {
    throw new Error("Not implemented")
  }

  async read() : Promise<ArrayBuffer> {
    let typedArray = await fs.readFile(this.id);
    return typedArray.buffer.slice(typedArray.byteOffset, typedArray.byteLength + typedArray.byteOffset);
  }

  async write(data : ArrayBuffer) {
    await fs.writeFile(this.id, Buffer.from(data));
    return await fs.readFile(this.id);
  }
}

export class NodeDirectory extends files.Directory {
  private stat : Stats;
  private path : string;
  private watcher : FSWatcher;

  public extra = {};

  constructor(path : string, stat? : Stats) {
    super();
    this.path = path;
    this.stat = stat || statSync(path);

    this.watcher = watch(this.path, {recursive: true}, () => {
      this.dispatchChangeEvent();
    });
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

    this.watcher.close();
    this.watcher = watch(this.path, {recursive: true}, () => {
      this.dispatchChangeEvent();
    });
  }

  async delete() {
    this.watcher.close();
    for (let child of await this.getChildren()){
      await child.delete();
    }
    await fs.rmdir(this.id);
  }

  async search(query : string) : Promise<files.SearchResult[]> {
    throw new Error("Not implemented")
  }

  async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string) {
    if (!(fileData instanceof ArrayBuffer)) {
      throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`)
    }
    let filePath = path.join(this.id, filename);
    if (existsSync(filePath)){
      throw new FileAlreadyExistsError(`file named ${name} already exists`);
    }
    await fs.appendFile(filePath, Buffer.from(fileData));
    let stat = await fs.stat(filePath);
    return new NodeFile(filePath, stat);
  }

  async addDirectory(name : string) {
    let dirPath = path.join(this.id, name);
    if (existsSync(dirPath)){
      throw new FileAlreadyExistsError(`file named ${name} already exists`);
    }
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