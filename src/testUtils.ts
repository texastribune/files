import {MemoryDirectory, MemoryFile} from "./files/memory.js";
import {
  fileToArrayBuffer,
  parseJsonArrayBuffer,
  parseTextArrayBuffer,
  Requester,
  stringToArrayBuffer
} from "./utils.js";
import {FileNotFoundError, SearchResult} from "./files/base.js";
import * as files from "./files/base.js";


class MockBackendFile extends MemoryFile {
  protected readonly parent : MockBackendDirectory;

  constructor(parent : MockBackendDirectory, name : string, mimeType? : string, data? : ArrayBuffer) {
    super(parent , name, mimeType, data);
    this.parent = parent;
  }

  get url(){
    return new URL(`/${this.id}`, window.location.href).toString();
  }
}

class AddFile extends MockBackendFile {
  private newFile : MemoryFile | null = null;

  writeSync(data: ArrayBuffer): ArrayBuffer {
    let fileData = parseJsonArrayBuffer(data);
    this.newFile = new MockBackendFile(this.parent, fileData.name, fileData.type);
    this.parent.addChild(this.newFile);
    return data;
  }

  readSync(): ArrayBuffer {
    if (this.newFile === null){
      return new ArrayBuffer(0);
    }
    return stringToArrayBuffer(JSON.stringify({
      id: this.newFile.id,
      name: this.newFile.name,
      directory: this.newFile.directory,
      mimeType: this.newFile.mimeType,
      lastModified: this.newFile.lastModified.toISOString(),
      created: this.newFile.created.toISOString(),
      url:  new URL(`/${this.newFile.id}`, window.location.href).toString(),
      icon: null,
      size: this.newFile.size,
    }))
  }
}

class MkDirFile extends MockBackendFile {
  private newDir : MemoryDirectory | null = null;

  writeSync(data: ArrayBuffer): ArrayBuffer {
    let fileData = parseJsonArrayBuffer(data);
    this.newDir = new MockBackendDirectory(this.parent, fileData.name);
    this.parent.addChild(this.newDir);
    return data;
  }

  readSync(): ArrayBuffer {
    if (this.newDir === null) {
      return new ArrayBuffer(0);
    }
    return stringToArrayBuffer(JSON.stringify({
      id: this.newDir.id,
      name: this.newDir.name,
      directory: this.newDir.directory,
      mimeType: this.newDir.mimeType,
      lastModified: this.newDir.lastModified.toISOString(),
      created: this.newDir.created.toISOString(),
      url: new URL(`/${this.newDir.id}`, window.location.href).toString(),
      icon: null,
      size: this.newDir.size,
    }));
  }
}

class RenameFile extends MockBackendFile {
  async write(data: ArrayBuffer): Promise<ArrayBuffer> {
    let fileData = parseJsonArrayBuffer(data);
    let target = await this.parent.getById(fileData.id);
    await target.rename(fileData.name);
    return data;
  }
}

class DeleteFile extends MockBackendFile {
  async write(data: ArrayBuffer): Promise<ArrayBuffer> {
    let id = parseTextArrayBuffer(data);
    let target = await this.parent.getById(id);
    await target.delete();
    return data;
  }
}

class CopyFile extends MockBackendFile {
  async write(data: ArrayBuffer): Promise<ArrayBuffer> {
    let id = parseTextArrayBuffer(data);
    let file = await this.parent.getById(id);
    await file.copy(this.parent);
    return new ArrayBuffer(0);
  }
}

class MoveFile extends MockBackendFile {
  async write(data: ArrayBuffer): Promise<ArrayBuffer> {
    let id = parseTextArrayBuffer(data);
    let file = await this.parent.getById(id);
    await file.move(this.parent);
    return new ArrayBuffer(0);
  }
}

class SearchFile extends MockBackendFile {
  private lastResult : SearchResult[]= [];

  writeSync(data: ArrayBuffer): ArrayBuffer {
    let searchData = parseJsonArrayBuffer(data);
    this.lastResult = this.parent.searchSync(searchData.query);
    return new ArrayBuffer(0);
  }

  readSync(): ArrayBuffer {
    let data = [];
    for (let searchData of this.lastResult){
      data.push({
        path: searchData.path,
        file: {
          id: searchData.file.id,
          name: searchData.file.name,
          directory: searchData.file.directory,
          mimeType: searchData.file.mimeType,
          lastModified: searchData.file.lastModified.toISOString(),
          created: searchData.file.created.toISOString(),
          url: new URL(`/${searchData.file.id}`, window.location.href).toString(),
          icon: null,
          size: searchData.file.size,
        }
      })
    }
    return stringToArrayBuffer(JSON.stringify(data));
  }
}

export class MockBackendDirectory extends MemoryDirectory {
  static addDirectoryName = '.mkdir';
  static addFileName = '.add';
  static renameFileName = '.rename';
  static deleteFileName = '.delete';
  static copyFileName = '.copy';
  static moveFileName = '.move';
  static searchFileName = '.search';

  private readonly apiChildren : files.File[] = [
    new AddFile(this, MockBackendDirectory.addFileName),
    new MkDirFile(this, MockBackendDirectory.addDirectoryName),
    new RenameFile(this, MockBackendDirectory.renameFileName),
    new DeleteFile(this, MockBackendDirectory.deleteFileName),
    new CopyFile(this, MockBackendDirectory.copyFileName),
    new MoveFile(this, MockBackendDirectory.moveFileName),
    new SearchFile(this, MockBackendDirectory.searchFileName),
  ];

  get url(){
    return new URL(`/${this.id}`, window.location.href).toString();
  }

  private async getDirChildById(file : files.File, id : string) : Promise<files.File | null> {
    if (file.id === id){
      return file;
    }
    if (file instanceof files.Directory) {
      for (let child of await file.getChildren()){
        let found = await this.getDirChildById(child, id);
        if (found !== null){
          return found;
        }
      }
    }
    return null;
  }

  async getById(id : string) : Promise<files.File> {
    let file = await this.getDirChildById(this, id);
    if (file === null){
      throw new FileNotFoundError(`no file with id ${id}`)
    }
    return file;
  }

  async getChildren(): Promise<files.File[]> {
    let children = await super.getChildren();
    return children.concat(this.apiChildren);
  }


  addFileSync(fileData : ArrayBuffer, filename : string, mimeType : string) : MemoryFile {
    let newFile = new MockBackendFile(this, filename, mimeType, fileData);
    this.addChild(newFile);
    return newFile;
  }

  addDirectorySync(name : string) : MemoryDirectory {
    let newDir = new MockBackendDirectory(this, name);
    this.addChild(newDir);
    return newDir;
  }
}

export class MockRemoteRequester implements Requester {
  private readonly rootDirectory : MockBackendDirectory;

  constructor(rootDirectory : MockBackendDirectory) {
    this.rootDirectory = rootDirectory;
  }

  private getId(url : URL) : string {
    let s =  url.pathname.substring(url.pathname.lastIndexOf('/'));
    if (s[0] === '/') {
      s = s.slice(1);
    }
    return s;
  }

  async request(url: URL, query?: { [p: string]: string }, data?: FormData | Blob | null, method?: "GET" | "POST" | "PUT" | "DELETE"): Promise<ArrayBuffer> {
    let id = this.getId(url);
    const requestedFile = await this.rootDirectory.getById(id);

    if (requestedFile === null){
      throw new Error("404 file does not exist");
    }

    if (data instanceof FormData) {
      if (requestedFile instanceof files.Directory) {
        let resp = new ArrayBuffer(0);

        let formData : {name: string, value: FormDataEntryValue}[] = [];
        data.forEach((formDataEntry, name :string) => {
          formData.push({
            name: name,
            value: formDataEntry,
          });
        });

        for (let entry of formData) {
          if (entry.name === "write") {
            if (entry.value instanceof File) {
              let data = await fileToArrayBuffer(entry.value);
              let f = await requestedFile.getFile([entry.value.name]);
              await f.write(data);
            }
          } else if (entry.name === "read") {
            if (typeof entry.value === "string") {
              let f = await requestedFile.getFile([entry.value]);
              resp = await f.read();
            }
          }
        }

        return resp;
      }
    } else {
      method = method || "GET";
      if (method === "GET") {
        return requestedFile.read();
      } else if (method === "POST" && data) {
        let buf = await fileToArrayBuffer(data);
        return await requestedFile.write(buf);
      }
    }

    throw new Error("method not allowed");
  }
}