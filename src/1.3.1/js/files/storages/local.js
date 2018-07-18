import {AbstractFileStorage} from "./base.js";
import {FileNotFoundError} from "./base.js";
import {fileToDataUrl} from "../../utils.js";


export class LocalStorageFileStorage extends AbstractFileStorage {
  /**
   * This storage uses IndexedDB to store files locally in the browser.
   */
  constructor() {
    super();

    let currentDateString = new Date().toISOString();
    this._rootFileNode = {
      id: this.constructor.fsRootId,
      name: 'root',
      url: "",
      lastModified: currentDateString,
      created: currentDateString,
      directory: true,
      icon: null,
      size: 0,
      mimeType: 'application/json'
    };
  }

  static get dbName() {
    return 'db';
  }

  static get fsRootId() {
    return 'fsRoot';
  }

  static get dbVersion() {
    return 2;
  }

  async getDB() {
    return await new Promise((resolve, reject) => {
      let dbRequest = window.indexedDB.open(this.constructor.dbName, this.constructor.dbVersion);
      dbRequest.onupgradeneeded = (event) => {
        let db = dbRequest.result;
        if (event.oldVersion < 2){
          try{
            db.deleteObjectStore("files");
          } catch (e) {
            // Does not exist. Keep going.
          }
        }
        let objectStore = db.createObjectStore("files", {keyPath: 'id', autoIncrement: true});
        objectStore.createIndex('parentId', 'parentId', {unique: false});
        objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], {unique: true});
      };
      dbRequest.onerror = (event) => {
        reject(`Error connecting to the database: ${event.target.error}`);
      };
      dbRequest.onsuccess = () => {
        let db = dbRequest.result;
        resolve(db);
      };
    });
  }

  async _fileDataToFileNode(fileData) {
    let node = {
      id: fileData.id,
      name: fileData.name,
      icon: null,
      created: fileData.created,
      hidden: fileData.name.startsWith('.')
    };
    if (fileData.file) {
      Object.assign(node, {
        directory: false,
        url: await fileToDataUrl(fileData.file),
        size: fileData.file.size,
        lastModified: new Date(fileData.file.lastModified).toISOString(),
        mimeType: fileData.file.type
      });
    } else {
      Object.assign(node, {
        directory: true,
        url: "",
        size: 0,
        lastModified: fileData.created,
        mimeType: 'application/json'
      });
    }
    return node;
  }

  async _createDirectoryFile(fileNode) {
    let db = await this.getDB();
    let transaction = db.transaction(["files"]);
    return await new Promise((resolve, reject) => {
      let promises = [];
      let childCursorRequest = transaction.objectStore("files").index('parentId').openCursor(fileNode.id);
      childCursorRequest.onerror = () => {
        reject(`Could not get files contained in directory ${fileNode.name}.`);
      };
      childCursorRequest.onsuccess = () => {
        let cursor = childCursorRequest.result;
        if (cursor) {
          // For each row, get the file data and add a promise for the fileNode to the promises list.
          cursor.continue();
          let fileData = cursor.value;
          promises.push(this._fileDataToFileNode(fileData));
        } else {
          // Once through all the rows, resolve all of the promises and creates a directory file.
          Promise.all(promises)
            .then((fileNodes) => {
              let fileData = {};
              for (let fileNode of fileNodes){
                fileData[fileNode.name] = fileNode;
              }
              let file = new File([JSON.stringify(fileData)], fileNode.name,
              {type: fileNode.mimeType, lastModified: new Date(fileNode.lastModified).getTime() / 1000});
              resolve(file);
            })
            .catch(reject);
        }
      };
    });
  }

  get rootFileNode() {
    return this._rootFileNode;
  }

  async readFileNode(fileNode, params) {
    let db = await this.getDB();
    let transaction = db.transaction(["files"]);
    return await new Promise((resolve, reject) => {
      let request = transaction.objectStore("files").get(fileNode.id);
      request.onerror = () => {
        reject(new FileNotFoundError(`Could not find file ${fileNode.name}.`));
      };
      request.onsuccess = () => {
        if (fileNode.directory) {
          this._createDirectoryFile(fileNode)
            .then(resolve)
            .catch(reject);
        } else {
          resolve(request.result.file);
        }
      }
    });
  }

  async writeFileNode(fileNode, data) {
    let db = await this.getDB();
    let transaction = db.transaction(["files"], "readwrite");
    return await new Promise((resolve, reject) => {
      let request = transaction.objectStore("files").get(fileNode.id);
      request.onerror = () => {
        reject(new FileNotFoundError(`Could not find file ${fileNode.name}.`));
      };
      request.onsuccess = () => {
        let fileData = request.result;
        fileData.file = new File([data], fileNode.name, {type: data.type});  // Normalize/insure is file
        let requestUpdate = transaction.objectStore("files").put(fileData);
        requestUpdate.onerror = () => {
          reject(`Could not update file ${fileNode.name}`);
        };
        requestUpdate.onsuccess = () => {
          resolve(fileData.file);
        };
      }
    });
  }

  _validate(fileData){
    fileData.name = new String(fileData.name);
    if (!fileData.file instanceof File){
      throw new Error("Invalid file.");
    }
    return fileData;
  }

  async _addItem(parentNode, name, file) {
    // Normalize/insure is file
    file = file || null;
    if (file && !file instanceof File) {
      let type = file.type || 'application/octet-stream';
      file = new File([file], name, {type: type});
    }

    let db = await this.getDB();
    let transaction = db.transaction(["files"], "readwrite");
    return await new Promise((resolve, reject) => {
      let fileData = {
        parentId: parentNode.id,
        name: name,
        file: file,
        created: new Date().toISOString()
      };
      fileData = this._validate(fileData);
      let fileRequest = transaction.objectStore("files").add(fileData);
      fileRequest.onerror = () => {
        reject(`Could not add file ${name}.`);
      };
      fileRequest.onsuccess = (event) => {
        resolve(this._fileDataToFileNode(fileData));
      }
    });
  }

  async addFile(parentNode, file, filename) {
    return await this._addItem(parentNode, filename, file);
  }

  async addDirectory(parentNode, name) {
    return await this._addItem(parentNode, name);
  }

  async rename(fileNode, newName) {
    let db = await this.getDB();
    let transaction = db.transaction(["files"], "readwrite");
    return await new Promise((resolve, reject) => {
      let request = transaction.objectStore("files").get(fileNode.id);
      request.onerror = () => {
        reject(new FileNotFoundError(`Could not find file ${fileNode.name}.`));
      };
      request.onsuccess = () => {
        let fileData = request.result;
        fileData.name = newName;
        let requestUpdate = transaction.objectStore("files").put(fileData);
        requestUpdate.onerror = () => {
          reject(`Could not update file ${fileNode.name}`);
        };
        requestUpdate.onsuccess = () => {
          resolve(fileData.file);
        };
      };
    });
  }

  async delete(fileNode) {
    let db = await this.getDB();
    let transaction = db.transaction(["files"], "readwrite");
    return await new Promise((resolve, reject) => {
      let request = transaction.objectStore("files").delete(fileNode.id);
      request.onerror = () => {
        reject(new Error(`Could not delete file ${fileNode.name}.`));
      };
      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async copy(source, targetParent) {
    let db = await this.getDB();
    let transaction = db.transaction(["files"], "readwrite");
    return await new Promise((resolve, reject) => {
      let request = transaction.objectStore("files").get(source.id);
      request.onerror = () => {
        reject(new FileNotFoundError(`Could not find file ${source.name}.`));
      };
      request.onsuccess = () => {
        let fileData = request.result;
        delete fileData.id;
        let requestUpdate = transaction.objectStore("files").put(fileData);
        requestUpdate.onerror = () => {
          reject(`Could not update file ${fileNode.name}`);
        };
        requestUpdate.onsuccess = () => {
          resolve(fileData.file);
        };
      };
    });
  }

  async move(source, targetParent) {
    let db = await this.getDB();
    let transaction = db.transaction(["files"], "readwrite");
    return await new Promise((resolve, reject) => {
      let request = transaction.objectStore("files").get(source.id);
      request.onerror = () => {
        reject(new FileNotFoundError(`Could not find file ${source.name}.`));
      };
      request.onsuccess = () => {
        let fileData = request.result;
        fileData.parentId = targetParent.id;
        let requestUpdate = transaction.objectStore("files").put(fileData);
        requestUpdate.onerror = () => {
          reject(`Could not update file ${fileNode.name}`);
        };
        requestUpdate.onsuccess = () => {
          resolve(fileData.file);
        };
      };
    });
  }

  /**
   * Search the current directory and its subdirectories recursively for files matching the given search term.
   * @async
   * @abstract
   * @param {string} query - Search terms.
   * @returns {FileNode[]} - The data for the newly created directory
   */
  async search(query) {
    throw new Error("Not implemented")
  }

  /**
   * Create a duplicate instance of this file system.
   * @abstract
   * @returns {AbstractFileStorage} - A new instance with the same state.
   */
  clone() {
    throw new Error("Not implemented")
  };
}
