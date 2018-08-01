import {AbstractFileStorage} from "./base.js";
import {FileNotFoundError} from "./base.js";
import {arrayBufferToDataUrl, stringToArrayBuffer} from "../../utils.js";


function indexedDbRequestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            resolve(event.target.result)
        };
        request.onerror = (event) => {
            reject(event.target.error)
        };
    });
}

function indexedDbCursorRequestToPromise(cursorRequest) {
    return new Promise((resolve, reject) => {
        let data = [];
        cursorRequest.onerror = reject;
        cursorRequest.onsuccess = (event) => {
            let cursor = event.target.result;
            if (cursor) {
                // For each row, get the file data and add a promise for the fileNode to the promises list.
                cursor.continue();
                data.push(cursor.value);
            } else {
                resolve(data);
            }
        };
    });
}


/**
 * A storage class uses IndexedDB to store files locally in the browser.
 * @extends AbstractFileStorage
 */
export class LocalStorageFileStorage extends AbstractFileStorage {
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
        this._dbPromise = this.getDB();
    }

    static get dbName() {
        return 'db';
    }

    static get fsRootId() {
        return 'fsRoot';
    }

    /**
     * An array of functions to perform on database for version upgrades. Each migration corresponds to a
     * database version. If there are 3 migration functions and a users database is on version 1, the last
     * two functions will be run. The final version of the database will be 3. The function can return a promise or
     * nothing.
     * @returns {function[]} - An array of functions the either can return nothing or a promise.
     */
    static get migrations() {
        return [
            (db, transaction) => {
                // Create
                let objectStore = db.createObjectStore("files", {keyPath: 'id', autoIncrement: true});
                objectStore.createIndex('parentId', 'parentId', {unique: false});
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], {unique: true});
            },
            (db, transaction) => {
                // Delete and rebuild
                db.deleteObjectStore("files");
                let objectStore = db.createObjectStore("files", {keyPath: 'id', autoIncrement: true});
                objectStore.createIndex('parentId', 'parentId', {unique: false});
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], {unique: true});
            },
            (db, transaction) => {
                // Convert files to ArrayBuffers, add mimeType and lastModified fields
                let cursorRequest = transaction.objectStore("files").getAll();
                return indexedDbRequestToPromise(cursorRequest)
                    .then((fileDataArray) => {
                        let promises = [];
                        for (let fileData of fileDataArray) {
                            if (fileData.file) {
                                fileData.mimeType = fileData.type;
                                fileData.lastModified = fileData.file.lastModified;
                                fileData.file = new ArrayBuffer(2);  // TODO
                            } else {
                                fileData.mimeType = 'application/json';
                                fileData.lastModified = fileData.created;
                            }
                            promises.push(
                                indexedDbRequestToPromise(transaction.objectStore("files").put(fileData))
                            );
                        }
                        return Promise.all(promises);
                    });
            }
        ]
    }

    async getDB() {
        return await new Promise((resolve, reject) => {
            let newVersion = this.constructor.migrations.length;
            let dbRequest = window.indexedDB.open(this.constructor.dbName, newVersion);

            dbRequest.onsuccess = (event) => {
                let db = event.target.result;
                resolve(db);
            };

            dbRequest.onupgradeneeded = (event) => {
                // Run the migration functions that are needed
                let db = event.target.result;
                let transaction = event.target.transaction;
                let migrationsToApply = this.constructor.migrations.slice(event.oldVersion);
                let upgradeMigrationChain = Promise.resolve();
                for (let i = 0; i < migrationsToApply.length; i++) {
                    let migration = migrationsToApply[i];
                    upgradeMigrationChain = upgradeMigrationChain
                        .then(() => {
                            console.log(`Running migration for version ${i}.`);
                            return migration(db, transaction) || Promise.resolve();
                        });
                }
                upgradeMigrationChain = upgradeMigrationChain
                    .catch((event) => {
                        reject(`Error updating the database from ${event.oldVersion} to ${newVersion}: ${event}`);
                    });

                dbRequest.onsuccess = (event) => {
                    upgradeMigrationChain
                        .then(() => {
                            let db = event.target.result;
                            resolve(db);
                        });
                };
            };
            dbRequest.onerror = (event) => {
                reject(`Error connecting to the database: ${event.target.error}`);
            };

        });
    }

    _fileDataToFileNode(fileData) {
        let node = {
            id: fileData.id,
            name: fileData.name,
            icon: null,
            created: fileData.created,
            lastModified: fileData.lastModified,
            hidden: fileData.name.startsWith('.'),
            mimeType: fileData.mimeType
        };
        if (fileData.file) {
            Object.assign(node, {
                directory: false,
                url: arrayBufferToDataUrl(fileData.file, fileData.mimeType),  //TODO this puts everything in memory :(
                size: fileData.file.size
            });
        } else {
            Object.assign(node, {
                directory: true,
                url: "",
                size: 0
            });
        }
        return node;
    }

    async _createDirectoryArrayBuffer(id) {
        let db = await this._dbPromise;
        let transaction = db.transaction("files");
        let childCursorRequest = transaction.objectStore("files").index('parentId').openCursor(id);
        let fileDataArray = await indexedDbCursorRequestToPromise(childCursorRequest);
        let fileNodes = [];
        for (let fileData of fileDataArray){
            let fileNode = this._fileDataToFileNode(fileData);
            fileNode.id = fileNode.id.toString();
            fileNodes.push(fileNode);
        }
        return stringToArrayBuffer(JSON.stringify(fileNodes));
    }

    async getRootFileNode() {
        return this._rootFileNode;
    }

    async readFileNode(id, params) {
        let rootFileNode = await this.getRootFileNode();
        if (id === rootFileNode.id) {
            return await this._createDirectoryArrayBuffer(id);
        } else {
            let fileData;
            let db = await this._dbPromise;
            let transaction = db.transaction("files");
            try {
                fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(parseInt(id)));
            } catch (e) {
                throw new FileNotFoundError(`Could not find file with id ${id}.`);
            }
            if (fileData.file === null) {
                return await this._createDirectoryArrayBuffer(id);
            } else {
                return fileData.file;
            }
        }
    }

    async writeFileNode(id, data) {
        let db = await this._dbPromise;
        let transaction = db.transaction("files", "readwrite");
        let fileData;

        // Get stored file data
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(parseInt(id)));
        } catch (e) {
            new FileNotFoundError(`Could not find file with id ${id}.`);
        }

        // Update file data and validate
        fileData.file = data;
        fileData = await this._validate(fileData);

        // Write back to database
        try {
            await indexedDbRequestToPromise(transaction.objectStore("files").put(fileData));
        } catch (e) {
            throw new Error(`Could not update file ${fileData.name}`);
        }
        return fileData.file;
    }

    async _validate(fileData) {
        fileData.name = new String(fileData.name);
        if (fileData.file !== null && !(fileData.file instanceof ArrayBuffer)) {
            throw new Error(`Invalid file data. Must be ArrayBuffer, not ${typeof fileData.file}`);
        }

        let rootFileNode = await this.getRootFileNode();
        if (fileData.parentId !== rootFileNode.id) {
            let db = await this._dbPromise;
            let transaction = db.transaction("files");
            let parentFileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(parseInt(fileData.parentId)));
            if (!parentFileData) {
                throw new FileNotFoundError(`Parent does not exist with id ${fileData.parentId}`);
            }
            if (parentFileData.file) {
                throw new Error(`Parent with id ${fileData.parentId} is not a directory.`);
            }
        }

        return fileData;
    }

    async _addItem(parentId, name, file, type) {
        // Normalize/insure is file
        file = file || null;
        type = type || 'application/octet-stream';
        if (file === null) {
            type = 'application/json';
        }

        let now = new Date().toISOString();
        let fileData = {
            parentId: parentId,
            name: name,
            file: file,
            mimeType: type,
            lastModified: now,
            created: now
        };
        fileData = await this._validate(fileData);

        let db = await this._dbPromise;
        let transaction = db.transaction("files", "readwrite");
        try {
            let newId = await indexedDbRequestToPromise(transaction.objectStore("files").add(fileData));
            fileData.id = newId.toString();
        } catch (e) {
            throw new Error(`Could not add file ${name}.`);
        }
        return this._fileDataToFileNode(fileData);
    }

    async addFile(parentId, file, filename, mimeType) {
        return await this._addItem(parentId, filename, file, mimeType);
    }

    async addDirectory(parentId, name) {
        return await this._addItem(parentId, name);
    }

    async rename(id, newName) {
        let db = await this._dbPromise;
        let transaction = db.transaction("files", "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(parseInt(id)));
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
        let db = await this._dbPromise;
        let transaction = db.transaction("files", "readwrite");

        try {
            await indexedDbRequestToPromise(transaction.objectStore("files").delete(parseInt(id)));
        } catch (e) {
            throw new Error(`Could not delete file with id ${id}.`);
        }
    }

    async copy(sourceId, targetParentId) {
        let db = await this._dbPromise;
        let transaction = db.transaction("files", "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(parseInt(sourceId)));
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
        let db = await this._dbPromise;
        let transaction = db.transaction("files", "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore("files").get(parseInt(sourceId)));
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

