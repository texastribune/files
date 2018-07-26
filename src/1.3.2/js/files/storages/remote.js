import {parseJsonFile} from "../../utils.js";
import {FileNotFoundError, AbstractFileStorage} from "./base.js";


/**
 * A mixin that implements the methods addFile, addDirectory, rename, delete, copy, move and search
 * by writing to hidden virtual files. The backend must must support those operations.
 * @mixin HiddenFileAPIMixin
 * @param {AbstractFileStorage} fileStorageClass - A subclass of AbstractFileStorage.
 * @returns {AbstractFileStorage}
 */
export let HiddenFileAPIMixin = (fileStorageClass) => {
  return class extends fileStorageClass {
    constructor(...args) {
      super(...args);

      this.addDirectoryName = '.mkdir';
      this.addFileName = '.add';
      this.renameFileName = '.rename';
      this.deleteFileName = '.delete';
      this.moveFileName = '.move';
      this.searchFileName = '.search';
    }

    async _getAPIFileNode(dirId, name) {
      let directoryFile = await storage.readFileNode(dirId);
      let dirData = await parseJsonFile(directoryFile);
      let fileNode = dirData[name];
      if (!fileNode) {
        throw new FileNotFoundError(`API file ${name} not found.`);
      }
      return fileNode;
    }

    async addFile(parentId, file, filename) {
      let data = new FormData;
      data.append('file', file);
      if (filename) {
        data.append('name', filename);
      }

      let apiFileNode = await this._getAPIFileNode(parentId, this.addFileName);
      return await this.writeFileNode(apiFileNode.id, data);
    }

    async addDirectory(parentId, name) {
      let apiFileNode = await this._getAPIFileNode(parentId, this.addDirectoryName);
      return await this.writeFileNode(apiFileNode.id, name);
    }

    async rename(id, newName) {
      let data = new FormData;
      data.append('id', id);
      data.append('to', newName);

      let apiFileNode = await this._getAPIFileNode(this.rootFileNode.id, this.renameFileName);
      await this.writeFileNode(apiFileNode.id, data);
    }

    async delete(id) {
      let apiFileNode = await this._getAPIFileNode(this.rootFileNode.id, this.deleteFileName);
      await this.writeFileNode(apiFileNode.id, id);
    }

    async copy(sourceId, targetNodeId) {
      // TODO
      await super.copy(sourceId);
    }

    async move(sourceId, targetNodeId) {
      let apiFileNode = await this._getAPIFileNode(targetNodeId, this.moveFileName);
      await this.writeFileNode(apiFileNode, sourceId);
    }

    async search(id, query) {
      let apiFileNode = await this._getAPIFileNode(fileNodeId, this.searchFileName);
      let searchFile = await this.readFileNode(apiFileNode, {query: query});
      return parseJsonFile(searchFile);
    }
  };
};

/**
 * This storage uses an API that interacts with files via virtual files in each directory.
 * @extends AbstractFileStorage
 * @mixes HiddenFileAPIMixin
 */
export class FileAPIFileStorage extends HiddenFileAPIMixin(AbstractFileStorage) {
  constructor(baseUrl) {
    super();
    this._baseUrl = baseUrl;
    this.requestTimeout = 10;  // seconds

    let currentDateString = new Date().toISOString();
    this._rootFileNode = {
      id: "",
      name: 'root',
      url: this._baseUrl,
      directory: true,
      icon: null,
      size: 0,
      mimeType: 'application/json',
      lastModified: currentDateString,
      created: currentDateString
    };
  }

  clone() {
    let clonedFS = new this.constructor(this._baseUrl);
    clonedFS.changeDirectory(this.path, true);
    return clonedFS;
  }

  get rootFileNode() {
    return this._rootFileNode;
  }

  async readFileNode(id, params) {
    params = params || {};
    return await this._ajax(this._baseUrl + id, params, 'GET');
  }

  async writeFileNode(id, data) {
    return await this._ajax(this._baseUrl + id, data, 'POST');
  }

  async _ajax(url, data, method) {
    return await new Promise((resolve, reject) => {
      data = data || {};

      method = method || 'GET';
      method = method.toUpperCase();
      if (method === 'GET' || method === 'DELETE') {
        url = url + this.constructor.encodeQueryData(data);
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
              resolve(new Blob([request.response], {type: contentType}));
            } else {
              let errorText = new TextDecoder().decode(request.response);
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
      if (!(data === null || data instanceof FormData || typeof data === "string" || data instanceof String)) {
        data = JSON.stringify(data);
        request.setRequestHeader("Content-Type", 'application/json');
      }
      this.constructor.configureAjaxRequest(request, method, url, data);
      request.send(data);
    });
  }

  static configureAjaxRequest(request, method, url, data) {
    if (!this.isCrossDomain(url)) {
      request.withCredentials = true;
      request.setRequestHeader("X-CSRFToken", this.csrfCookie);
    }
  }

  static getCookie(name) {
    let parts = document.cookie.split(`${name}=`);
    if (parts.length > 1) {
      parts = parts[1].split(';');
      return parts[0] || null;
    }
    return null;
  }

  static encodeQueryData(data) {
    let ret = [];
    for (let d in data) {
      if (data.hasOwnProperty(d)) {
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
      }
    }
    return '?' + ret.join('&');
  }

  static isCrossDomain(url) {
    let a = document.createElement("a");
    a.href = url;
    return window.location.protocol + '//' + window.location.host !==
      a.protocol + '//' + a.host;
  }

  static get csrfCookie() {
    return this.getCookie("csrftoken");
  }
}
