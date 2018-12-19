import {Directory, BasicFile, FileNotFoundError} from "./base.ts";
import {parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer} from "../utils.ts";

function configureAjaxRequest(request, method, url, data) {
  if (!this.isCrossDomain(url)) {
    request.withCredentials = true;
    request.setRequestHeader("X-CSRFToken", this.getCookie("csrftoken"));
  }
}

function getCookie(name) {
  let parts = document.cookie.split(`${name}=`);
  if (parts.length > 1) {
    parts = parts[1].split(';');
    return parts[0] || null;
  }
  return null;
}

function encodeQueryData(data) {
  let ret = [];
  for (let d in data) {
    if (data.hasOwnProperty(d)) {
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    }
  }
  return '?' + ret.join('&');
}

function isCrossDomain(url) {
  let a = document.createElement("a");
  a.href = url;
  return window.location.protocol + '//' + window.location.host !==
    a.protocol + '//' + a.host;
}


async function ajax(url, data, method) {
  return await new Promise((resolve, reject) => {
    data = data || {};

    method = method || 'GET';
    method = method.toUpperCase();
    if (method === 'GET' || method === 'DELETE') {
      url = url + encodeQueryData(data);
      data = null;
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
    request.timeout = this.requestTimeout * 1000;
    configureAjaxRequest(request, method, url, data);
    request.send(data);
  });
}




class RemoteFile extends BasicFile {
  constructor(parent, fileData) {
    super();
    this._parent = parent;
    this._fileData = fileData;
  }

  get parent() {
    return this._parent;
  }

  get id() {
    return this._fileData.id;
  }

  get name() {
    return this._fileData.name;
  }

  get mimeType(){
    return this._fileData.mimeType;
  }

  get lastModified() {
    return this._fileData.lastModified;
  }

  get created() {
    return this._fileData.created;
  }

  get url() {
    return this._fileData.url;
  }

  get icon() {
    return this._fileData.icon;
  }

  get size() {
    return this._fileData.size;
  }


  async read(params) {
    params = params || {};
    return await ajax(this.id, params, 'GET');
  }

  async write(data) {
    return await ajax(this.id, data, 'POST');
  }

  async rename(newName) {
    let data = new FormData;
    data.append('id', this.id);
    data.append('to', newName);

    let file = await this._parent.findFile(this._parent.renameFileName);
    await file.write(data);
  }

  async delete() {
    let file = await this._parent.findFile(this._parent.deleteFileName);
    await file.write(stringToArrayBuffer(this.id));
  }
}


class RemoteDirectory extends DirectoryMixin(RemoteFile) {
  constructor(parent, fileData){
    super();
    this._parent = parent;
    this._fileData = fileData;

    this.addDirectoryName = '.mkdir';
    this.addFileName = '.add';
    this.renameFileName = '.rename';
    this.deleteFileName = '.delete';
    this.moveFileName = '.move';
    this.searchFileName = '.search';
  }

  get parent() {
    return this._parent;
  }

  get id() {
    return this._fileData.id;
  }

  get name() {
    return this._fileData.name;
  }

  get lastModified() {
    return this._fileData.lastModified;
  }

  get created() {
    return this._fileData.created;
  }

  get icon() {
    return this._fileData.icon;
  }

  async rename(newName) {
    let data = new FormData;
    data.append('id', this.id);
    data.append('to', newName);

    let file = await this._parent.findFile(this._parent.renameFileName);
    await file.write(data);
  }

  async delete() {
    let file = await this._parent.findFile(this._parent.deleteFileName);
    await file.write(stringToArrayBuffer(this.id));
  }

  async findFile(name) {
    let children = await this.getChildren();
    while (children.length > 0){
      let child = children.pop();
      if (child.name === name){
        return child;
      }
    }
    throw new FileNotFoundError(`API file ${name} not found.`);
  }

  async search(query) {
    let file = await this.findFile(this.searchFileName);
    let fileDataArray = await file.readJSON();
    let files = [];
    for (let data of fileDataArray){
      if (data.directory){
        files.push(new RemoteDirectory(this, data));
      } else {
        files.push(new RemoteFile(this, data));
      }
    }
    return files;
  }

  async addFile(fileData, filename, mimeType) {
    let data = new FormData;
    data.append('file', new Blob([fileData], {type: mimeType}));
    if (filename) {
      data.append('name', filename);
    }

    let file = await this.findFile(this.addFileName);
    let newData = await file.write(data);
    return new RemoteFile(this, newData);
  }

  async addDirectory(name) {
    let file = await this.findFile(this.addDirectoryName);
    let newData = await file.write(stringToArrayBuffer(name));
    return new RemoteDirectory(this, newData);
  }

  async getChildren() {
    let data = await super.read();
    let fileDataArray = parseJsonArrayBuffer(data);
    let files = [];
    for (let data of fileDataArray){
      if (data.directory){
        files.push(new RemoteDirectory(this, data));
      } else {
        files.push(new RemoteFile(this, data));
      }
    }
    return files;
  }
}