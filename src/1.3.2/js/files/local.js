import {AbstractDirectory, AbstractFile, DirectoryMixin, FileNotFoundError} from "./base.js";


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

class Database {
    constructor(name) {
        this.name = name;
        this._readyPromise = null;
    }

    /**
     * An array of functions to perform on database for version upgrades. Each migration corresponds to a
     * database version. If there are 3 migration functions and a users database is on version 1, the last
     * two functions will be run. The final version of the database will be 3. The function can return a promise or
     * nothing.
     * @returns {function[]} - An array of functions the either can return nothing or a promise.
     */
    static get migrations() {
        return []
    }

    getDB() {
        console.log("READ", this._readyPromise === null);
        if (this._readyPromise === null){
            this._readyPromise = new Promise((resolve, reject) => {
                let newVersion = this.constructor.migrations.length;
                let dbRequest = window.indexedDB.open(this.name, newVersion);

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
        return this._readyPromise
    }
}

class FileStore extends Database {
    static get objectStoreName(){
        return 'files';
    }

    static get migrations() {
        let storeName = this.objectStoreName;
        return [
            (db, transaction) => {
                // Create
                let objectStore = db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
                objectStore.createIndex('parentId', 'parentId', {unique: false});
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], {unique: true});
            },
            (db, transaction) => {
                // Delete and rebuild
                db.deleteObjectStore("files");
                let objectStore = db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
                objectStore.createIndex('parentId', 'parentId', {unique: false});
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], {unique: true});
            },
            (db, transaction) => {
                // Convert files to ArrayBuffers, add mimeType and lastModified fields
                let cursorRequest = transaction.objectStore(storeName).getAll();
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
                                indexedDbRequestToPromise(transaction.objectStore(storeName).put(fileData))
                            );
                        }
                        return Promise.all(promises);
                    });
            }
        ]
    }

    async add(parentId, name, file, type) {
        let now = new Date().toISOString();
        let fileData = {
            parentId: parentId,
            name: name,
            file: file,
            mimeType: type,
            lastModified: now,
            created: now
        };
        fileData = this.validate(fileData);

        let db = await this.getDB();
        let transaction = db.transaction(this.constructor.objectStoreName, "readwrite");
        try {
            let newId = await indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).add(fileData));
            fileData.id = newId.toString();
        } catch (e) {
            throw new Error(`Could not add file ${fileData.name}, ${parentId}`);
        }

        return fileData;
    }

    async get(id){
        let db = await this.getDB();
        let transaction = db.transaction(this.constructor.objectStoreName);

        try {
            return await indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).get(parseInt(id)));
        } catch (e) {
            throw new FileNotFoundError(`Could not find file with id ${id}.`);
        }
    }

    async update(id, updateFields) {
        let db = await this.getDB();
        let transaction = db.transaction(this.constructor.objectStoreName, "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).get(parseInt(id)));
        } catch (e) {
            throw new FileNotFoundError(`Could not find file with id ${id}.`);
        }

        Object.assign(fileData, updateFields);
        fileData.lastModified = new Date().toISOString();
        fileData = this.validate(fileData);

        try {
            await indexedDbRequestToPromise(transaction.objectStore(this.constructor.objectStoreName).put(fileData));
        } catch (e) {
            throw new Error(`Could not update file id ${id}.`);
        }

        return fileData;
    }

    async delete(id) {
        let db = await this.getDB();
        let transaction = db.transaction(this.constructor.objectStoreName, "readwrite");
        let objectStore = transaction.objectStore(this.constructor.objectStoreName);

        try {
            await indexedDbRequestToPromise(objectStore.delete(parseInt(id)));
        } catch (e) {
            throw new Error(`Could not delete file with id ${id}.`);
        }

        let childCursorRequest = objectStore.index('parentId').openCursor(id);
        let children = await indexedDbCursorRequestToPromise(childCursorRequest);
        for (let child of children){
            try {
                await indexedDbRequestToPromise(objectStore.delete(child.id));
            } catch (e) {
                throw new Error(`Could not delete file with id ${id}.`);
            }
        }
    }

    async copy(sourceId, targetParentId) {
        let fileData = this.get(sourceId);
        await this.add(targetParentId, fileData.name, fileData.file, fileData.type);
    }

    async move(sourceId, targetParentId) {
        await this.update(sourceId, {parentId: targetParentId});
    }

    async search(id, query) {
        throw new Error("Not implemented")
    }

    async getChildren(id){
        let db = await this.getDB();
        let transaction = db.transaction(this.constructor.objectStoreName);
        let childCursorRequest = transaction.objectStore(this.constructor.objectStoreName).index('parentId').openCursor(id);
        return await indexedDbCursorRequestToPromise(childCursorRequest);
    }

    validate(fileData) {
        fileData.name = fileData.name.toString();
        if (fileData.file !== null && !(fileData.file instanceof ArrayBuffer)) {
            throw new Error(`Invalid file data. Must be ArrayBuffer, not ${typeof fileData.file}`);
        }
        if (!fileData.lastModified){
            throw new Error(`Invalid file data. Not lastModified time.`);
        }
        if (!fileData.created){
            throw new Error(`Invalid file data. Not created time.`);
        }

        return fileData;
    }

    async close(){
        let db = await this.getDB();
        db.close();
        this._readyPromise = null;
    }

    async clearAll(){
        let deleteDBRequest = window.indexedDB.deleteDatabase(this.name);
        await new Promise((resolve, reject) => {
            deleteDBRequest.onsuccess = (event) => {
                this._readyPromise = null;
                resolve()
            };
            deleteDBRequest.onerror = (event) => {
                reject()
            };
        });
    }
}


export const database = new FileStore('db');


function fileDataToInstance(fileData) {
    let lastModified = new Date(fileData.lastModified);
    let created = new Date(fileData.created);
    if (fileData.file){
        return new LocalStorageFile(fileData.id.toString(), fileData.name, created, lastModified,
            fileData.mimeType, fileData.file.byteLength);
    } else {
        return new LocalStorageDirectory(fileData.id.toString(), fileData.name, created, lastModified);
    }
}


/**
 * A storage class uses IndexedDB to store files locally in the browser.
 */
export class LocalStorageFile extends AbstractFile {
    constructor(databaseData) {
        super();
        this._id = databaseData.id.toString();
        this._name = databaseData.name;
        this._created = new Date(databaseData.lastModified);
        this._lastModified = new Date(databaseData.created);
        this._mimeType = databaseData.mimeType;
        if (databaseData.file){
            this._size = databaseData.file.size;
        } else {
            this._size = null;
        }
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get url() {
        return null;
    }

    get icon() {
        return null;
    }

    get lastModified() {
        return this._lastModified;
    }

    get created() {
        return this._created;
    }

    get mimeType(){
        return this._mimeType;
    }

    get size(){
        return this._size;
    }
    //
    // async getParent() {
    //     let data = await database.get(this.id);
    //     let parentData = await database.get(data.parentId);
    //     return fileDataToInstance(parentData);
    // }

    async read(params) {
        let fileData = await database.get(this.id);
        return fileData.file;
    }

    async write(data) {
        this.update(this.id, {file: data});
        return data;
    }

    async rename(newName) {
        await database.update(this.id, {name: newName});
    }

    async delete() {
        await database.delete(this.id);
    }

    async copy(targetParentId) {
        await database.copy(this.id, targetParentId);
    }

    async move(targetParentId) {
        await database.move(this.id, targetParentId);
    }
}

/**
 * A directory class uses IndexedDB to store files locally in the browser.
 */
export class LocalStorageDirectory extends DirectoryMixin(LocalStorageFile) {
    constructor(databaseData) {
        super(databaseData);
    }

    async getChildren() {
        let children = [];
        let childData = await database.getChildren(this.id);
        for (let child of childData){
            if (child.file){
                children.push(new LocalStorageFile(child));
            } else {
                children.push(new LocalStorageDirectory(child));
            }
        }
        return children;
    }

    async addFile(file, name, mimeType) {
        if (!(file instanceof ArrayBuffer)) {
            throw new Error(`Invalid file data. Must be ArrayBuffer, not ${typeof file}`);
        }
        if (!name){
            throw new Error("No filename given");
        }
        mimeType = mimeType || 'application/octet-stream';
        let fileData = await database.add(this.id, name, file, mimeType);
        return new LocalStorageFile(fileData);
    }

    async addDirectory(name) {
        let fileData = await database.add(this.id, name, null, AbstractDirectory.mimeType);
        return new LocalStorageDirectory(fileData);
    }

    async rename(newName) {
        await database.update(this.id, {name: newName});
    }

    async delete() {
        await database.delete(this.id);
    }

    async copy(targetParentId) {
        await database.copy(this.id, targetParentId);
    }

    async move(targetParentId) {
        await database.move(this.id, targetParentId);
    }

    async search(id, query) {
        throw new Error("Not implemented")
    }
}

export class LocalStorageRoot extends LocalStorageDirectory {
    constructor() {
        let now = new Date().toISOString();
        super({
            id: 'fsRoot',
            file: null,
            name: 'root',
            create: now,
            lastModified: now
        });
    }
}