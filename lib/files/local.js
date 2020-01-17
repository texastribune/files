import * as files from "./base";
import { FileAlreadyExistsError } from "./base.js";
function indexedDbRequestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            resolve(request.result);
        };
        request.onerror = (event) => {
            reject(request.error);
        };
    });
}
function indexedDbCursorRequestToPromise(cursorRequest) {
    return new Promise((resolve, reject) => {
        let data = [];
        cursorRequest.onerror = reject;
        cursorRequest.onsuccess = (event) => {
            if (event.target) {
                let cursor = cursorRequest.result;
                if (cursor !== null) {
                    // For each row, get the file data and add a promise for the fileNode to the promises list.
                    cursor.continue();
                    data.push(cursor.value);
                }
                else {
                    resolve(data);
                }
            }
        };
    });
}
class Database {
    constructor(name) {
        this.readyPromise = null;
        this.name = name;
    }
    /**
     * An array of functions to perform on database for version upgrades. Each migration corresponds to a
     * database version. If there are 3 migration functions and a users database is on version 1, the last
     * two functions will be run. The final version of the database will be 3. The function can return a promise or
     * nothing.
     * @returns {function[]} - An array of functions the either can return nothing or a promise.
     */
    get migrations() {
        return [];
    }
    getDB() {
        if (this.readyPromise === null) {
            this.readyPromise = new Promise((resolve, reject) => {
                let newVersion = this.migrations.length;
                let dbRequest = window.indexedDB.open(this.name, newVersion);
                dbRequest.onsuccess = (event) => {
                    let db = dbRequest.result;
                    resolve(db);
                };
                dbRequest.onupgradeneeded = (event) => {
                    // Run the migration functions that are needed
                    let db = dbRequest.result;
                    let transaction = dbRequest.transaction;
                    let migrationsToApply = this.migrations.slice(event.oldVersion);
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
                            let db = dbRequest.result;
                            resolve(db);
                        });
                    };
                };
                dbRequest.onerror = (event) => {
                    reject(`Error connecting to the database: ${dbRequest.error}`);
                };
            });
        }
        return this.readyPromise;
    }
    async close() {
        let db = await this.getDB();
        db.close();
        this.readyPromise = null;
    }
    async clearAll() {
        let deleteDBRequest = window.indexedDB.deleteDatabase(this.name);
        await new Promise((resolve, reject) => {
            deleteDBRequest.onsuccess = (event) => {
                this.readyPromise = null;
                resolve();
            };
            deleteDBRequest.onerror = (event) => {
                reject();
            };
        });
    }
}
class FileStore extends Database {
    constructor(databaseName, storeName) {
        super(databaseName);
        this.onFileChangeListeners = new Set();
        this.objectStoreName = storeName;
    }
    get migrations() {
        return [
            async (db, transaction) => {
                // Create
                let objectStore = db.createObjectStore(this.objectStoreName, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('parentId', 'parentId', { unique: false });
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], { unique: true });
            },
            async (db, transaction) => {
                // Delete and rebuild
                db.deleteObjectStore("files");
                let objectStore = db.createObjectStore(this.objectStoreName, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('parentId', 'parentId', { unique: false });
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], { unique: true });
            },
            async (db, transaction) => {
                // Convert files to ArrayBuffers, add mimeType and lastModified fields
                let cursorRequest = transaction.objectStore(this.objectStoreName).getAll();
                let fileDataArray = await indexedDbRequestToPromise(cursorRequest);
                let promises = [];
                for (let fileData of fileDataArray) {
                    if (fileData.file) {
                        fileData.mimeType = fileData.type;
                        fileData.lastModified = fileData.file.lastModified;
                        fileData.file = new ArrayBuffer(2); // TODO
                    }
                    else {
                        fileData.mimeType = 'application/json';
                        fileData.lastModified = fileData.created;
                    }
                    if (fileData.parentId === 'fsRoot') {
                        fileData.parentId = null;
                    }
                    else {
                        try {
                            fileData.parentId = parseInt(fileData.parentId);
                        }
                        catch (e) {
                            fileData.parentId = null;
                        }
                    }
                    promises.push(indexedDbRequestToPromise(transaction.objectStore(this.objectStoreName).put(fileData)));
                }
                await Promise.all(promises);
            }
        ];
    }
    async onChange(id) {
        for (let listener of this.onFileChangeListeners) {
            listener(id);
        }
        if (id !== null) {
            try {
                let fileData = await this.get(id);
                await this.onChange(fileData.parentId);
            }
            catch (NotFoundError) {
                // No parent
            }
        }
    }
    addOnFilesChangedListener(listener) {
        this.onFileChangeListeners.add(listener);
    }
    removeOnFilesChangedListener(listener) {
        this.onFileChangeListeners.delete(listener);
    }
    async add(parentId, name, file, type) {
        let now = new Date().toISOString();
        if (file === undefined) {
            type = files.Directory.mimeType;
        }
        else if (type === undefined) {
            type = 'application/octet-stream';
        }
        let unSavedFileData = {
            parentId: parentId,
            name: name,
            file: file || null,
            mimeType: type,
            lastModified: now,
            created: now
        };
        unSavedFileData = this.validate(unSavedFileData);
        let db = await this.getDB();
        let transaction = db.transaction(this.objectStoreName, "readwrite");
        let fileData;
        try {
            let newId = await indexedDbRequestToPromise(transaction.objectStore(this.objectStoreName).add(unSavedFileData));
            fileData = Object.assign(unSavedFileData, { id: newId });
        }
        catch (e) {
            if (e.name === "ConstraintError") {
                throw new FileAlreadyExistsError(`file named ${unSavedFileData.name} already exists`);
            }
            throw new Error(`Could not add file ${name}, ${parentId}`);
        }
        await this.onChange(parentId);
        return fileData;
    }
    async get(id) {
        let db = await this.getDB();
        let transaction = db.transaction(this.objectStoreName);
        let fileData = await indexedDbRequestToPromise(transaction.objectStore(this.objectStoreName).get(id));
        if (fileData === undefined) {
            throw new files.FileNotFoundError(`Could not find file with id ${id}.`);
        }
        return fileData;
    }
    async update(id, updateFields) {
        let db = await this.getDB();
        let transaction = db.transaction(this.objectStoreName, "readwrite");
        // Get file data from database
        let fileData = await indexedDbRequestToPromise(transaction.objectStore(this.objectStoreName).get(id));
        if (fileData === undefined) {
            throw new files.FileNotFoundError(`Could not find file with id ${id}.`);
        }
        Object.assign(fileData, updateFields);
        fileData.lastModified = new Date().toISOString();
        fileData = this.validate(fileData);
        try {
            await indexedDbRequestToPromise(transaction.objectStore(this.objectStoreName).put(fileData));
        }
        catch (e) {
            if (e.name === "ConstraintError") {
                throw new FileAlreadyExistsError(`file named ${fileData.name} already exists`);
            }
            throw new Error(`Could not update file id ${id}.`);
        }
        await this.onChange(fileData.id);
        return fileData;
    }
    async delete(id) {
        let db = await this.getDB();
        let transaction = db.transaction(this.objectStoreName, "readwrite");
        let objectStore = transaction.objectStore(this.objectStoreName);
        let existing = await indexedDbRequestToPromise(transaction.objectStore(this.objectStoreName).get(id));
        if (existing === undefined) {
            throw new files.FileNotFoundError(`Could not find file with id ${id}.`);
        }
        try {
            await indexedDbRequestToPromise(objectStore.delete(id));
        }
        catch (e) {
            throw new Error(`Could not delete file with id ${id}.`);
        }
        let childCursorRequest = objectStore.index('parentId').openCursor(id);
        let children = await indexedDbCursorRequestToPromise(childCursorRequest);
        for (let child of children) {
            try {
                await indexedDbRequestToPromise(objectStore.delete(child.id));
            }
            catch (e) {
                throw new Error(`Could not delete file with id ${id}.`);
            }
        }
        await this.onChange(existing.parentId);
    }
    async copy(sourceId, targetParentId) {
        let fileData = await this.get(sourceId);
        await this.add(targetParentId, fileData.name, fileData.file, fileData.mimeType);
    }
    async move(sourceId, targetParentId) {
        await this.update(sourceId, { parentId: targetParentId });
    }
    async search(id, query) {
        throw new Error("Not implemented");
    }
    async getChildren(id) {
        let db = await this.getDB();
        let transaction = db.transaction(this.objectStoreName);
        let childCursorRequest = transaction.objectStore(this.objectStoreName).index('parentId').openCursor(id);
        return await indexedDbCursorRequestToPromise(childCursorRequest);
    }
    validate(fileData) {
        fileData.name = fileData.name.toString();
        if (fileData.file !== null && !(fileData.file instanceof ArrayBuffer)) {
            throw new Error(`Invalid file data. Must be ArrayBuffer, not ${typeof fileData.file}`);
        }
        if (!fileData.lastModified) {
            throw new Error(`Invalid file data. Not lastModified time.`);
        }
        if (!fileData.created) {
            throw new Error(`Invalid file data. Not created time.`);
        }
        return fileData;
    }
}
export const database = new FileStore('db', 'files');
/**
 * A storage class uses IndexedDB to store files locally in the browser.
 */
export class LocalStorageFile extends files.BasicFile {
    constructor(databaseData) {
        super();
        this.listenerMap = new Map();
        this.url = null;
        this.icon = null;
        this.extra = {};
        this.intId = databaseData.id;
        this._name = databaseData.name;
        this.created = new Date(databaseData.lastModified);
        this._lastModified = new Date(databaseData.created);
        this.mimeType = databaseData.mimeType;
        if (databaseData.file) {
            this._size = databaseData.file.byteLength;
        }
        else {
            this._size = 0;
        }
    }
    get id() {
        return this.intId.toString();
    }
    get name() {
        return this._name;
    }
    get lastModified() {
        return this._lastModified;
    }
    get size() {
        return this._size;
    }
    addOnChangeListener(listener) {
        let databaseListener = (id) => {
            if (id === this.intId) {
                listener(this);
            }
        };
        this.listenerMap.set(listener, databaseListener);
        database.addOnFilesChangedListener(databaseListener);
    }
    removeOnChangeListener(listener) {
        let databaseListener = this.listenerMap.get(listener);
        if (databaseListener !== undefined) {
            database.removeOnFilesChangedListener(databaseListener);
            this.listenerMap.delete(listener);
        }
    }
    async read() {
        let fileData = await database.get(this.intId);
        return fileData.file || new ArrayBuffer(0);
    }
    async write(data) {
        let fileData = await database.update(this.intId, { file: data });
        this._size = data.byteLength;
        this._lastModified = new Date(fileData.lastModified);
        return data;
    }
    async rename(newName) {
        let fileData = await database.update(this.intId, { name: newName });
        this._name = fileData.name;
    }
    async delete() {
        await database.delete(this.intId);
    }
    async copy(targetDirectory) {
        if (targetDirectory instanceof LocalStorageDirectory) {
            await database.copy(this.intId, targetDirectory.intId);
        }
    }
    async move(targetDirectory) {
        if (targetDirectory instanceof LocalStorageDirectory) {
            await database.move(this.intId, targetDirectory.intId);
        }
    }
}
/**
 * A directory class uses IndexedDB to store files locally in the browser.
 */
export class LocalStorageDirectory extends files.Directory {
    constructor(databaseData) {
        super();
        this.listenerMap = new Map();
        this.icon = null;
        this.extra = {};
        this.intId = databaseData.id;
        this._name = databaseData.name;
        this.created = new Date(databaseData.lastModified);
        this._lastModified = new Date(databaseData.created);
    }
    get id() {
        return this.intId.toString();
    }
    get name() {
        return this._name;
    }
    get lastModified() {
        return this._lastModified;
    }
    addOnChangeListener(listener) {
        let databaseListener = (id) => {
            if (id === this.intId) {
                listener(this);
            }
        };
        this.listenerMap.set(listener, databaseListener);
        database.addOnFilesChangedListener(databaseListener);
    }
    removeOnChangeListener(listener) {
        let databaseListener = this.listenerMap.get(listener);
        if (databaseListener !== undefined) {
            database.removeOnFilesChangedListener(databaseListener);
            this.listenerMap.delete(listener);
        }
    }
    async rename(newName) {
        let fileData = await database.update(this.intId, { name: newName });
        this._name = fileData.name;
    }
    async delete() {
        await database.delete(this.intId);
    }
    async getChildren() {
        let children = [];
        let childDataArray = await database.getChildren(this.intId);
        for (let childData of childDataArray) {
            if (childData.file) {
                children.push(new LocalStorageFile(childData));
            }
            else {
                children.push(new LocalStorageDirectory(childData));
            }
        }
        return children;
    }
    async addFile(file, name, mimeType) {
        if (!(file instanceof ArrayBuffer)) {
            throw new Error(`Invalid file data. Must be ArrayBuffer, not ${typeof file}`);
        }
        if (!name) {
            throw new Error("No filename given");
        }
        mimeType = mimeType || 'application/octet-stream';
        let fileData = await database.add(this.intId, name, file, mimeType);
        return new LocalStorageFile(fileData);
    }
    async addDirectory(name) {
        let fileData = await database.add(this.intId, name, null, files.Directory.mimeType);
        return new LocalStorageDirectory(fileData);
    }
    async search(query) {
        let results = [];
        for (let child of await this.getChildren()) {
            if (child.name.includes(query)) {
                results.push({ path: [child.name,], file: child });
            }
            if (child instanceof files.Directory) {
                let subResults = await child.search(query);
                for (let result of subResults) {
                    result.path.unshift(child.name);
                }
                results = results.concat(subResults);
            }
        }
        return results;
    }
}
export class LocalStorageRoot extends LocalStorageDirectory {
    constructor() {
        let now = new Date().toISOString();
        super({
            id: 0,
            parentId: null,
            file: null,
            name: 'root',
            created: now,
            lastModified: now,
            mimeType: files.Directory.mimeType
        });
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
}
LocalStorageRoot.id = 'fsRoot';
