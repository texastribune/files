import {AbstractFileStorage} from "./base.js";
import {FileNotFoundError} from "./base.js";
import {fileToDataUrl} from "../../utils.js";


async function indexedDbRequestToPromise(request) {
    return await new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            resolve(event.target.result)
        };
        request.onerror = (event) => {
            reject(event.target.error)
        };
    });
}

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
                let db = event.target.result;
                if (event.oldVersion < 2) {
                    try {
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
            dbRequest.onsuccess = (event) => {
                let db = event.target.result;
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
            if (!(fileData.file instanceof File)){
                console.log("WHAT IS", fileData, File);
                console.trace();
            }
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

    async _createDirectoryFile(id, name, created) {
        let db = await this.getDB();
        let transaction = db.transaction("files");
        return await new Promise((resolve, reject) => {
            let promises = [];
            let childCursorRequest = transaction.objectStore("files").index('parentId').openCursor(id);
            childCursorRequest.onerror = () => {
                reject(`Could not get files contained in directory ${name}.`);
            };
            childCursorRequest.onsuccess = (event) => {
                let cursor = event.target.result;
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
                            for (let fileNode of fileNodes) {
                                fileData[fileNode.name] = fileNode;
                            }
                            let file = new File([JSON.stringify(fileData)], name,
                                {type: 'application/json', lastModified: new Date(created).getTime() / 1000});
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

    async readFileNode(id, params) {
        if (id === this.rootFileNode.id) {
            return this._createDirectoryFile(id, this.rootFileNode.name, this.rootFileNode.created);
        } else {
            let fileData;
            let db = await this.getDB();
            let transaction = db.transaction("files");
            try {
                fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(id));
            } catch (e) {
                throw new FileNotFoundError(`Could not find file with id ${id}.`);
            }
            if (fileData.file === null) {
                return this._createDirectoryFile(id, fileData.name, fileData.created);
            } else {
                return fileData.file;
            }
        }
    }

    async writeFileNode(id, data) {
        let db = await this.getDB();
        let transaction = db.transaction("files", "readwrite");
        let fileData;

        // Get stored file data
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(id));
        } catch (e) {
            new FileNotFoundError(`Could not find file with id ${id}.`);
        }

        // Update file
        fileData.file = new File([data], fileData.name, {type: data.type});  // Normalize insure is file

        // Write back to database
        try {
            await indexedDbRequestToPromise(transaction.objectStore("files").put(fileData));
        } catch (e) {
            throw new Error(`Could not update file ${fileData.name}`);
        }
        return fileData.file;
    }

    _validate(fileData) {
        fileData.name = new String(fileData.name);
        if (!fileData.file instanceof File) {
            throw new Error("Invalid file.");
        }
        return fileData;
    }

    async _addItem(parentId, name, file) {
        // Normalize/insure is file
        file = file || null;
        if (file && !file instanceof Blob) {
            let type = file.type || 'application/octet-stream';
            file = new Blob([file], {type: type});
        }

        let fileData = {
            parentId: parentId,
            name: name,
            file: file,
            created: new Date().toISOString()
        };
        fileData = this._validate(fileData);

        let db = await this.getDB();
        let transaction = db.transaction("files", "readwrite");
        try {
            console.log("FILE DATA", fileData);
            await indexedDbRequestToPromise(transaction.objectStore("files").add(fileData));
        } catch (e) {
            console.log("ERRRR", e);
            throw new Error(`Could not add file ${name}.`);
        }
        return this._fileDataToFileNode(fileData);
    }

    async addFile(parentId, file, filename) {
        return await this._addItem(parentId, filename, file);
    }

    async addDirectory(parentId, name) {
        return await this._addItem(parentId, name);
    }

    async rename(id, newName) {
        let db = await this.getDB();
        let transaction = db.transaction("files", "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(id));
        } catch (e) {
            throw new FileNotFoundError(`Could not find file with id ${id}.`);
        }

        // Update name with new name
        fileData.name = newName;

        // Put back in database
        try {
            await indexedDbRequestToPromise(transaction.objectStore("files").put(fileData));
        } catch (e) {
            throw new Error(`Could not update file with id ${id}`);
        }

        return fileData.file;
    }

    async delete(id) {
        let db = await this.getDB();
        let transaction = db.transaction("files", "readwrite");
        if (id === undefined) {
            console.log("IDAAAAA", id);
            console.trace();
        }

        try {
            await indexedDbRequestToPromise(transaction.objectStore("files").delete(id));
        } catch (e) {
            throw new Error(`Could not delete file with id ${id}.`);
        }
    }

    async copy(sourceId, targetParentId) {
        let db = await this.getDB();
        let transaction = db.transaction("files", "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = indexedDbRequestToPromise(transaction.objectStore("files").get(sourceId));
        } catch (e) {
            throw new FileNotFoundError(`Could not find file with id ${sourceId}.`);
        }

        fileData.parentId = targetParentId;
        delete fileData.id;

        try {
            await indexedDbRequestToPromise(transaction.objectStore("files").put(fileData));
        } catch (e) {
            throw new Error(`Could not copy to file with id ${targetParentId}`);
        }

        return fileData.file;
    }

    async move(sourceId, targetParentId) {
        let db = await this.getDB();
        let transaction = db.transaction("files", "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = indexedDbRequestToPromise(transaction.objectStore("files").get(sourceId));
        } catch (e) {
            throw new FileNotFoundError(`Could not find file with id ${id}.`);
        }

        // update parent to new target parent
        fileData.parentId = targetParentId;

        // Put back in database
        try {
            await indexedDbRequestToPromise(transaction.objectStore("files").put(fileData));
        } catch (e) {
            throw new Error(`Could not move to file with id ${targetParentId}`);
        }

        return fileData.file;
    }

    async search(id, query) {
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
