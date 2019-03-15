import * as files from "./base";
import {parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer} from "../utils";

const REQUEST_TIMEOUT = 30;


function getCookie(name : string) : string | null {
  let parts = document.cookie.split(`${name}=`);
  if (parts.length > 1) {
    parts = parts[1].split(';');
    return parts[0] || null;
  }
  return null;
}

function encodeQueryData(data : {[name : string] : string}) {
  let ret = [];
  for (let d in data) {
    if (data.hasOwnProperty(d)) {
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    }
  }
  return '?' + ret.join('&');
}

function isCrossDomain(url : string) {
  let a = document.createElement("a");
  a.href = url;
  return window.location.protocol + '//' + window.location.host !==
    a.protocol + '//' + a.host;
}

interface FileData {
  id: string;
  name: string;
  directory: boolean;
  mimeType: string;
  lastModified: string;
  created: string;
  url: string;
  icon: string | null;
  size: number;
}

async function ajax(url : string, query? : {[name : string] : string}, data? : Blob | null, method? : 'GET' | 'POST' | 'PUT' | 'DELETE') : Promise<ArrayBuffer> {
  console.log("URL", url);
  return await new Promise((resolve, reject) => {
    data = data || null;
    query = query || {};

    method = method || 'GET';
    if (method === 'GET' || method === 'DELETE') {
      url = url + encodeQueryData(query);
    }

    let request = new XMLHttpRequest();
    request.responseType = "arraybuffer";
    request.onreadystatechange = () => {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 0) {
          reject("An error has occurred");
        } else {
          let contentType = request.getResponseHeader('content-type');
          if (request.status >= 200 && request.status < 400) {
            resolve(request.response);
          } else {
            let errorText = parseTextArrayBuffer(request.response);
            let errorMessage = `${request.status} error: `;
            if (contentType === 'application/json') {
              try {
                let errorJson = JSON.parse(errorText);
                for (let key in errorJson) {
                  errorMessage += `${key} - ${errorJson[key]}. `;
                }
                reject(new Error(errorMessage));
              } catch (e) {
                reject("Error parsing response.");
              }
            } else {
              errorMessage += errorText;
              reject(new Error(errorMessage));
            }
          }
        }
      }
    };

    request.open(method, url, true);
    request.timeout = REQUEST_TIMEOUT * 1000;
    if (!isCrossDomain(url)) {
      request.withCredentials = true;
      let cookie = getCookie("csrftoken");
      if (cookie !== null){
        request.setRequestHeader("X-CSRFToken", cookie);
      }
    }
    request.send(data);
  });
}


class RemoteFile extends files.BasicFile {
  private readonly parent : RemoteDirectory;
  private readonly fileData : FileData;
  public readonly extra = {};

  constructor(parent : RemoteDirectory, fileData : FileData) {
    super();
    this.parent = parent;
    this.fileData = fileData;
  }

  get id() {
    return this.fileData.id;
  }

  get name() {
    return this.fileData.name;
  }

  get mimeType(){
    return this.fileData.mimeType;
  }

  get lastModified() {
    return new Date(this.fileData.lastModified);
  }

  get created() {
    return new Date(this.fileData.created);
  }

  get url() {
    return 'http://localhost:8000' + this.fileData.url;
  }

  get icon() {
    return this.fileData.icon;
  }

  get size() {
    return this.fileData.size;
  }


  read(): Promise<ArrayBuffer> {
      return ajax(this.url, {}, null, 'GET');
  }

  async write(data : ArrayBuffer) : Promise<ArrayBuffer> {
    return await ajax(this.url, {}, new Blob([data], {type: this.mimeType}), 'POST');
  }

  async rename(newName : string) {
    let data = new FormData;
    data.append('id', this.id);
    data.append('to', newName);

    let file = await this.parent.getFile([RemoteDirectory.renameFileName]);
    await file.write(data);
  }

  async delete() {
    let file = await this.parent.getFile([RemoteDirectory.deleteFileName]);
    await file.write(stringToArrayBuffer(this.id));
  }
}


class RemoteDirectory extends files.Directory {
  static addDirectoryName = '.mkdir';
  static addFileName = '.add';
  static renameFileName = '.rename';
  static deleteFileName = '.delete';
  static moveFileName = '.move';
  static searchFileName = '.search';

  private readonly parent : RemoteDirectory | null;
  private readonly fileData : FileData;
  public readonly extra = {};

  constructor(parent : RemoteDirectory | null, fileData : FileData){
    super();
    this.parent = parent;
    this.fileData = fileData;
  }

  get id() {
    return this.fileData.id;
  }

  get name() {
    return this.fileData.name;
  }

  get lastModified() {
    return new Date(this.fileData.lastModified);
  }

  get created() {
    return new Date(this.fileData.created);
  }

  get url() {
    return 'http://localhost:8000' + this.fileData.url;
  }

  get icon() {
    return this.fileData.icon;
  }

  get size() {
    return this.fileData.size;
  }
  read(): Promise<ArrayBuffer> {
    return ajax(this.url, {}, null, 'GET');
  }

  async rename(newName : string) : Promise<void> {
    let data = new FormData;
    data.append('id', this.id);
    data.append('to', newName);

    if (this.parent == null){
      throw new Error('cannot rename root directory');
    }

    let file = await this.parent.getFile([RemoteDirectory.renameFileName]);
    await file.write(data);
  }

  async delete() : Promise<void> {
    if (this.parent == null){
      throw new Error('cannot delete root directory');
    }

    let file = await this.parent.getFile([RemoteDirectory.deleteFileName]);
    await file.write(stringToArrayBuffer(this.id));
  }


  async search(query: string) : Promise<files.SearchResult[]> {
    let file = await this.getFile([RemoteDirectory.searchFileName]);
    let data = await file.read();
    let fileDataMap = parseJsonArrayBuffer(data);
    if (fileDataMap instanceof Array){
      let files = [];
      for (let data of fileDataMap){
        if (data.directory){
          files.push(new RemoteDirectory(this, data));
        } else {
          files.push(new RemoteFile(this, data));
        }
      }
      return [];
    } else {
      throw new Error('search returned wrong data type');
    }
  }

  async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string) : Promise<RemoteFile> {
    let data = new FormData;
    data.append('file', new Blob([fileData], {type: mimeType}));
    if (filename) {
      data.append('name', filename);
    }

    let file = await this.getFile([RemoteDirectory.addFileName]);
    let newData = await file.write(data);
    return new RemoteFile(this, parseJsonArrayBuffer(newData));
  }

  async addDirectory(name : string) : Promise<RemoteDirectory> {
    let file = await this.getFile([RemoteDirectory.addDirectoryName]);
    let newData = await file.write(stringToArrayBuffer(name));
    return new RemoteDirectory(this, parseJsonArrayBuffer(newData));
  }

  async getChildren() : Promise<files.File[]> {
    let data = await this.read();
    let fileDataMap = parseJsonArrayBuffer(data);
    console.log("DATA", fileDataMap);
    let files = [];
    for (let name in fileDataMap){
      if (fileDataMap.hasOwnProperty(name)){
        let fileData : FileData = fileDataMap[name];
        fileData.name = name;
        if (fileData.directory){
          files.push(new RemoteDirectory(this, fileData));
        } else {
          files.push(new RemoteFile(this, fileData));
        }
      }
    }
    return files;

  }
}

export class RemoteFS extends RemoteDirectory {
  constructor(url : string){
    super(null, {
      id: url,
      name: 'root',
      directory: true,
      mimeType: files.Directory.mimeType,
      lastModified: new Date().toISOString(),
      created: new Date().toISOString(),
      url: url,
      icon: null,
      size: 0,
    })
  }
}