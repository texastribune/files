"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const files = __importStar(require("./base"));
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
        this._readyPromise = null;
        this.name = name;
    }
    /**
     * An array of functions to perform on database for version upgrades. Each migration corresponds to a
     * database version. If there are 3 migration functions and a users database is on version 1, the last
     * two functions will be run. The final version of the database will be 3. The function can return a promise or
     * nothing.
     * @returns {function[]} - An array of functions the either can return nothing or a promise.
     */
    static get migrations() {
        return [];
    }
    getDB() {
        if (this._readyPromise === null) {
            this._readyPromise = new Promise((resolve, reject) => {
                let newVersion = this.constructor.migrations.length;
                let dbRequest = window.indexedDB.open(this.name, newVersion);
                dbRequest.onsuccess = (event) => {
                    let db = dbRequest.result;
                    resolve(db);
                };
                dbRequest.onupgradeneeded = (event) => {
                    // Run the migration functions that are needed
                    let db = dbRequest.result;
                    let transaction = dbRequest.transaction;
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
        return this._readyPromise;
    }
}
class FileStore extends Database {
    static get objectStoreName() {
        return 'files';
    }
    static get migrations() {
        let storeName = this.objectStoreName;
        return [
            (db, transaction) => __awaiter(this, void 0, void 0, function* () {
                // Create
                let objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('parentId', 'parentId', { unique: false });
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], { unique: true });
            }),
            (db, transaction) => __awaiter(this, void 0, void 0, function* () {
                // Delete and rebuild
                db.deleteObjectStore("files");
                let objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('parentId', 'parentId', { unique: false });
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], { unique: true });
            }),
            (db, transaction) => __awaiter(this, void 0, void 0, function* () {
                // Convert files to ArrayBuffers, add mimeType and lastModified fields
                let cursorRequest = transaction.objectStore(storeName).getAll();
                let fileDataArray = yield indexedDbRequestToPromise(cursorRequest);
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
                    promises.push(indexedDbRequestToPromise(transaction.objectStore(storeName).put(fileData)));
                }
                yield Promise.all(promises);
            })
        ];
    }
    add(parentId, name, file, type) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let db = yield this.getDB();
            let transaction = db.transaction(this.constructor.objectStoreName, "readwrite");
            try {
                let newId = yield indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).add(unSavedFileData));
                return Object.assign(unSavedFileData, { id: newId.toString() });
            }
            catch (e) {
                throw new Error(`Could not add file ${name}, ${parentId}`);
            }
        });
    }
    get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let db = yield this.getDB();
            let transaction = db.transaction(this.constructor.objectStoreName);
            try {
                return yield indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).get(parseInt(id)));
            }
            catch (e) {
                throw new files.FileNotFoundError(`Could not find file with id ${id}.`);
            }
        });
    }
    update(id, updateFields) {
        return __awaiter(this, void 0, void 0, function* () {
            let db = yield this.getDB();
            let transaction = db.transaction(this.constructor.objectStoreName, "readwrite");
            // Get file data from database
            let fileData;
            try {
                fileData = yield indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).get(parseInt(id)));
            }
            catch (e) {
                throw new files.FileNotFoundError(`Could not find file with id ${id}.`);
            }
            Object.assign(fileData, updateFields);
            fileData.lastModified = new Date().toISOString();
            fileData = this.validate(fileData);
            try {
                return yield indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).put(fileData));
            }
            catch (e) {
                throw new Error(`Could not update file id ${id}.`);
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let db = yield this.getDB();
            let transaction = db.transaction(this.constructor.objectStoreName, "readwrite");
            let objectStore = transaction.objectStore(this.constructor.objectStoreName);
            try {
                yield indexedDbRequestToPromise(objectStore.delete(parseInt(id)));
            }
            catch (e) {
                throw new Error(`Could not delete file with id ${id}.`);
            }
            let childCursorRequest = objectStore.index('parentId').openCursor(id);
            let children = yield indexedDbCursorRequestToPromise(childCursorRequest);
            for (let child of children) {
                try {
                    yield indexedDbRequestToPromise(objectStore.delete(child.id));
                }
                catch (e) {
                    throw new Error(`Could not delete file with id ${id}.`);
                }
            }
        });
    }
    copy(sourceId, targetParentId) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData = yield this.get(sourceId);
            yield this.add(targetParentId, fileData.name, fileData.file, fileData.mimeType);
        });
    }
    move(sourceId, targetParentId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update(sourceId, { parentId: targetParentId });
        });
    }
    search(id, query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    getChildren(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let db = yield this.getDB();
            let transaction = db.transaction(this.constructor.objectStoreName);
            let childCursorRequest = transaction.objectStore(this.constructor.objectStoreName).index('parentId').openCursor(id);
            return yield indexedDbCursorRequestToPromise(childCursorRequest);
        });
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
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            let db = yield this.getDB();
            db.close();
            this._readyPromise = null;
        });
    }
    clearAll() {
        return __awaiter(this, void 0, void 0, function* () {
            let deleteDBRequest = window.indexedDB.deleteDatabase(this.name);
            yield new Promise((resolve, reject) => {
                deleteDBRequest.onsuccess = (event) => {
                    this._readyPromise = null;
                    resolve();
                };
                deleteDBRequest.onerror = (event) => {
                    reject();
                };
            });
        });
    }
}
exports.database = new FileStore('db');
/**
 * A storage class uses IndexedDB to store files locally in the browser.
 */
class LocalStorageFile extends files.BasicFile {
    constructor(databaseData) {
        super();
        this.url = null;
        this.icon = null;
        this.extra = {};
        this.id = databaseData.id.toString();
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
    get name() {
        return this._name;
    }
    get lastModified() {
        return this._lastModified;
    }
    get size() {
        return this._size;
    }
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData = yield exports.database.get(this.id);
            return fileData.file || new ArrayBuffer(0);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData = yield exports.database.update(this.id, { file: data });
            this._size = data.byteLength;
            this._lastModified = new Date(fileData.lastModified);
            return data;
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData = yield exports.database.update(this.id, { name: newName });
            this._name = fileData.name;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield exports.database.delete(this.id);
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            yield exports.database.copy(this.id, targetDirectory.id);
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            yield exports.database.move(this.id, targetDirectory.id);
        });
    }
}
exports.LocalStorageFile = LocalStorageFile;
/**
 * A directory class uses IndexedDB to store files locally in the browser.
 */
class LocalStorageDirectory extends files.Directory {
    constructor(databaseData) {
        super();
        this.icon = null;
        this.extra = {};
        this.id = databaseData.id.toString();
        this._name = databaseData.name;
        this.created = new Date(databaseData.lastModified);
        this._lastModified = new Date(databaseData.created);
    }
    get name() {
        return this._name;
    }
    get lastModified() {
        return this._lastModified;
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData = yield exports.database.update(this.id, { name: newName });
            this._name = fileData.name;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield exports.database.delete(this.id);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            let childDataArray = yield exports.database.getChildren(this.id);
            for (let childData of childDataArray) {
                if (childData.file) {
                    children.push(new LocalStorageFile(childData));
                }
                else {
                    children.push(new LocalStorageDirectory(childData));
                }
            }
            return children;
        });
    }
    addFile(file, name, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(file instanceof ArrayBuffer)) {
                throw new Error(`Invalid file data. Must be ArrayBuffer, not ${typeof file}`);
            }
            if (!name) {
                throw new Error("No filename given");
            }
            mimeType = mimeType || 'application/octet-stream';
            let fileData = yield exports.database.add(this.id, name, file, mimeType);
            return new LocalStorageFile(fileData);
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData = yield exports.database.add(this.id, name, null, files.Directory.mimeType);
            return new LocalStorageDirectory(fileData);
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
}
exports.LocalStorageDirectory = LocalStorageDirectory;
class LocalStorageRoot extends LocalStorageDirectory {
    constructor() {
        let now = new Date().toISOString();
        super({
            id: 'fsRoot',
            parentId: '',
            file: null,
            name: 'root',
            created: now,
            lastModified: now,
            mimeType: files.Directory.mimeType
        });
    }
}
exports.LocalStorageRoot = LocalStorageRoot;
