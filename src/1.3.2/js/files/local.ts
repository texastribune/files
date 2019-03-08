import * as files from "./base";


function indexedDbRequestToPromise(request : IDBRequest) : Promise<any> {
    return new Promise((resolve, reject) => {
        request.onsuccess = (event : Event) => {
            resolve(request.result)
        };
        request.onerror = (event : Event) => {
            reject(request.error)
        };
    });
}

function indexedDbCursorRequestToPromise(cursorRequest : IDBRequest<IDBCursorWithValue | null>) : Promise<any[]>{
    return new Promise((resolve, reject) => {
        let data : any[] = [];
        cursorRequest.onerror = reject;
        cursorRequest.onsuccess = (event) => {
            if (event.target){
                let cursor = cursorRequest.result;
                if (cursor !== null) {
                    // For each row, get the file data and add a promise for the fileNode to the promises list.
                    cursor.continue();
                    data.push(cursor.value);
                } else {
                    resolve(data);
                }
            }
        };
    });
}

class Database {
    name : string;
    _readyPromise : Promise<IDBDatabase> | null = null;

    constructor(name : string) {
        this.name = name;
    }

    /**
     * An array of functions to perform on database for version upgrades. Each migration corresponds to a
     * database version. If there are 3 migration functions and a users database is on version 1, the last
     * two functions will be run. The final version of the database will be 3. The function can return a promise or
     * nothing.
     * @returns {function[]} - An array of functions the either can return nothing or a promise.
     */
    static get migrations() : ((db : IDBDatabase, transaction : IDBTransaction) => Promise<void>)[] {
        return []
    }

    getDB() : Promise<IDBDatabase> {
        if (this._readyPromise === null){
            this._readyPromise = new Promise((resolve, reject) => {
                let newVersion = (this.constructor as typeof Database).migrations.length;
                let dbRequest = window.indexedDB.open(this.name, newVersion);

                dbRequest.onsuccess = (event : Event) => {
                    let db = dbRequest.result;
                    resolve(db);
                };

                dbRequest.onupgradeneeded = (event) => {
                    // Run the migration functions that are needed
                    let db = dbRequest.result;
                    let transaction = dbRequest.transaction as IDBTransaction;
                    let migrationsToApply = (this.constructor as typeof Database).migrations.slice(event.oldVersion);
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
        return this._readyPromise
    }
}

interface UnSavedFileData {
    parentId : string,
    name : string,
    file : ArrayBuffer | null,
    mimeType : string,
    lastModified : string,
    created : string
}

interface FileData extends UnSavedFileData{
    id: string
}

class FileStore extends Database {
    static get objectStoreName(){
        return 'files';
    }

    static get migrations() {
        let storeName = this.objectStoreName;
        return [
            async (db : IDBDatabase, transaction : IDBTransaction) => {
                // Create
                let objectStore = db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
                objectStore.createIndex('parentId', 'parentId', {unique: false});
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], {unique: true});
            },
            async (db : IDBDatabase, transaction : IDBTransaction) => {
                // Delete and rebuild
                db.deleteObjectStore("files");
                let objectStore = db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
                objectStore.createIndex('parentId', 'parentId', {unique: false});
                objectStore.createIndex('uniqueNameForDirectory', ['name', 'parentId'], {unique: true});
            },
            async (db : IDBDatabase, transaction : IDBTransaction) => {
                // Convert files to ArrayBuffers, add mimeType and lastModified fields
                let cursorRequest = transaction.objectStore(storeName).getAll();
                let fileDataArray = await indexedDbRequestToPromise(cursorRequest);
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
                await Promise.all(promises);
            }
        ]
    }

    async add(parentId : string, name : string, file? : ArrayBuffer | null, type? : string) : Promise<FileData> {
        let now = new Date().toISOString();
        if (file === undefined){
            type = files.Directory.mimeType;
        } else if (type === undefined) {
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
        let transaction = db.transaction((this.constructor as typeof FileStore).objectStoreName, "readwrite");
        try {
            let newId = await indexedDbRequestToPromise(transaction.objectStore((this.constructor as typeof FileStore).objectStoreName).add(unSavedFileData));
            return Object.assign(unSavedFileData, {id: newId.toString()});
        } catch (e) {
            throw new Error(`Could not add file ${name}, ${parentId}`);
        }
    }

    async get(id : string) : Promise<FileData> {
        let db = await this.getDB();
        let transaction = db.transaction((this.constructor as typeof FileStore).objectStoreName);

        try {
            return await indexedDbRequestToPromise(transaction.objectStore((this.constructor as typeof FileStore).objectStoreName).get(parseInt(id)));
        } catch (e) {
            throw new files.FileNotFoundError(`Could not find file with id ${id}.`);
        }
    }

    async update(id : string, updateFields : Object) : Promise<FileData> {
        let db = await this.getDB();
        let transaction = db.transaction((this.constructor as typeof FileStore).objectStoreName, "readwrite");

        // Get file data from database
        let fileData;
        try {
            fileData = await indexedDbRequestToPromise(transaction.objectStore((this.constructor as typeof FileStore).objectStoreName).get(parseInt(id)));
        } catch (e) {
            throw new files.FileNotFoundError(`Could not find file with id ${id}.`);
        }

        Object.assign(fileData, updateFields);
        fileData.lastModified = new Date().toISOString();
        fileData = this.validate(fileData);

        try {
            return await indexedDbRequestToPromise(transaction.objectStore((this.constructor as typeof FileStore).objectStoreName).put(fileData));
        } catch (e) {
            throw new Error(`Could not update file id ${id}.`);
        }
    }

    async delete(id : string) : Promise<void> {
        let db = await this.getDB();
        let transaction = db.transaction((this.constructor as typeof FileStore).objectStoreName, "readwrite");
        let objectStore = transaction.objectStore((this.constructor as typeof FileStore).objectStoreName);

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

    async copy(sourceId : string, targetParentId : string) {
        let fileData = await this.get(sourceId);
        await this.add(targetParentId, fileData.name, fileData.file, fileData.mimeType);
    }

    async move(sourceId : string, targetParentId : string) {
        await this.update(sourceId, {parentId: targetParentId});
    }

    async search(id : string, query : string) {
        throw new Error("Not implemented")
    }

    async getChildren(id : string){
        let db = await this.getDB();
        let transaction = db.transaction((this.constructor as typeof FileStore).objectStoreName);
        let childCursorRequest = transaction.objectStore((this.constructor as typeof FileStore).objectStoreName).index('parentId').openCursor(id);
        return await indexedDbCursorRequestToPromise(childCursorRequest);
    }

    validate(fileData : UnSavedFileData | FileData) {
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


/**
 * A storage class uses IndexedDB to store files locally in the browser.
 */
export class LocalStorageFile extends files.BasicFile {
    private _name : string;
    private _lastModified : Date;
    private _size : number;

    public readonly id : string;
    public readonly created : Date;
    public readonly mimeType : string;
    public readonly url = null;
    public readonly icon = null;
    public extra = {};

    constructor(databaseData : FileData) {
        super();
        this.id = databaseData.id.toString();
        this._name = databaseData.name;
        this.created = new Date(databaseData.lastModified);
        this._lastModified = new Date(databaseData.created);
        this.mimeType = databaseData.mimeType;
        if (databaseData.file){
            this._size = databaseData.file.byteLength;
        } else {
            this._size = 0;
        }
    }

    get name() : string {
        return this._name;
    }

    get lastModified() : Date {
        return this._lastModified;
    }

    get size() : number {
        return this._size;
    }

    async read(params? : Object) {
        let fileData = await database.get(this.id);
        return fileData.file || new ArrayBuffer(0);
    }

    async write(data : ArrayBuffer) {
        let fileData = await database.update(this.id, {file: data});
        this._size = data.byteLength;
        this._lastModified = new Date(fileData.lastModified);
        return data;
    }

    async rename(newName : string) {
        let fileData = await database.update(this.id, {name: newName});
        this._name = fileData.name;
    }

    async delete() {
        await database.delete(this.id);
    }

    async copy(targetDirectory : files.Directory) {
        await database.copy(this.id, targetDirectory.id);
    }

    async move(targetDirectory : files.Directory) {
        await database.move(this.id, targetDirectory.id);
    }
}

/**
 * A directory class uses IndexedDB to store files locally in the browser.
 */
export class LocalStorageDirectory extends files.Directory {
    private _name : string;
    private _lastModified : Date;

    public readonly id : string;
    public readonly created : Date;
    public readonly icon = null;
    public extra = {};

    constructor(databaseData : FileData) {
        super();

        this.id = databaseData.id.toString();
        this._name = databaseData.name;
        this.created = new Date(databaseData.lastModified);
        this._lastModified = new Date(databaseData.created);
    }

    get name() : string {
        return this._name;
    }

    get lastModified() {
        return this._lastModified;
    }

    async rename(newName : string) {
        let fileData = await database.update(this.id, {name: newName});
        this._name = fileData.name;
    }

    async delete() {
        await database.delete(this.id);
    }

    async getChildren() : Promise<files.File[]> {
        let children = [];
        let childDataArray = await database.getChildren(this.id);
        for (let childData of childDataArray){
            if (childData.file){
                children.push(new LocalStorageFile(childData));
            } else {
                children.push(new LocalStorageDirectory(childData));
            }
        }
        return children;
    }

    async addFile(file : ArrayBuffer, name : string, mimeType : string) {
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

    async addDirectory(name : string) {
        let fileData = await database.add(this.id, name, null, files.Directory.mimeType);
        return new LocalStorageDirectory(fileData);
    }

    async search(query : string) : Promise<files.SearchResult[]> {
        return [];
    }
}

export class LocalStorageRoot extends LocalStorageDirectory {
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