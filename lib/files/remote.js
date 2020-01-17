import * as files from "./base.js";
import { parseJsonArrayBuffer, stringToArrayBuffer, ajaxRequester } from "../utils.js";
class RemoteFile extends files.BasicFile {
    constructor(parent, fileData, apiUrl, listenerMap, requester) {
        super();
        this.extra = {};
        this.parent = parent;
        this.fileData = fileData;
        this.apiUrl = apiUrl;
        this.listenerMap = listenerMap;
        this.requester = requester || ajaxRequester;
    }
    get id() {
        return this.fileData.id;
    }
    get name() {
        return this.fileData.name;
    }
    get mimeType() {
        return this.fileData.mimeType;
    }
    get lastModified() {
        return new Date(this.fileData.lastModified);
    }
    get created() {
        return new Date(this.fileData.created);
    }
    get urlObject() {
        return new URL(this.fileData.url || this.id, this.apiUrl);
    }
    get url() {
        return this.urlObject.toString();
    }
    get icon() {
        return this.fileData.icon;
    }
    get size() {
        return this.fileData.size;
    }
    dispatchChangeEvent() {
        super.dispatchChangeEvent();
        console.log("DISPPARTE", this.parent.name, this.parent.onChangeListeners);
        this.parent.dispatchChangeEvent();
    }
    read() {
        return this.requester.request(this.urlObject, {}, null, 'GET');
    }
    async write(data) {
        let requestData;
        if (data instanceof FormData) {
            requestData = data;
        }
        else {
            requestData = new Blob([data], { type: this.mimeType });
        }
        let buf = await this.requester.request(this.urlObject, {}, requestData, 'POST');
        this.dispatchChangeEvent();
        return buf;
    }
    async rename(newName) {
        let file = await this.parent.getFile([RemoteDirectory.renameFileName]);
        await file.write(stringToArrayBuffer(JSON.stringify({
            id: this.id,
            name: newName,
        })));
        this.fileData.name = newName;
        this.dispatchChangeEvent();
    }
    async delete() {
        let file = await this.parent.getFile([RemoteDirectory.deleteFileName]);
        await file.write(stringToArrayBuffer(this.id));
        this.dispatchChangeEvent();
    }
    async copy(targetDirectory) {
        let file = await targetDirectory.getFile([RemoteDirectory.copyFileName]);
        await file.write(stringToArrayBuffer(this.id));
    }
    async move(targetDirectory) {
        let file = await targetDirectory.getFile([RemoteDirectory.moveFileName]);
        await file.write(stringToArrayBuffer(this.id));
        this.dispatchChangeEvent();
    }
}
class RemoteDirectory extends files.Directory {
    constructor(parent, fileData, apiUrl, listenerMap, requester) {
        super();
        this.extra = {};
        if (parent === null) {
            if (this instanceof RemoteFS) {
                this.parent = this;
            }
            else {
                this.parent = new RemoteFS('root', apiUrl, "", requester);
            }
        }
        else {
            this.parent = parent;
        }
        this.fileData = fileData;
        this.apiUrl = apiUrl;
        this.listenerMap = listenerMap;
        this.requester = requester || ajaxRequester;
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
    get urlObject() {
        return new URL(this.fileData.url || this.id, this.apiUrl);
    }
    get url() {
        return this.urlObject.toString();
    }
    get icon() {
        return this.fileData.icon;
    }
    get size() {
        return this.fileData.size;
    }
    dispatchChangeEvent() {
        super.dispatchChangeEvent();
        if (this.parent !== this) {
            console.log("DISPPARTE", this.parent.name, this.parent.onChangeListeners);
            this.parent.dispatchChangeEvent();
        }
        else {
            console.log("FOOBAR");
        }
    }
    async read() {
        return await this.requester.request(this.urlObject, {}, null, 'GET');
    }
    async rename(newName) {
        let file = await this.parent.getFile([RemoteDirectory.renameFileName]);
        await file.write(stringToArrayBuffer(JSON.stringify({
            id: this.id,
            name: newName,
        })));
        this.fileData.name = newName;
        this.dispatchChangeEvent();
    }
    async delete() {
        let file = await this.parent.getFile([RemoteDirectory.deleteFileName]);
        await file.write(stringToArrayBuffer(this.id));
        this.dispatchChangeEvent();
    }
    async copy(targetDirectory) {
        let file = await targetDirectory.getFile([RemoteDirectory.copyFileName]);
        await file.write(stringToArrayBuffer(this.id));
    }
    async move(targetDirectory) {
        let file = await targetDirectory.getFile([RemoteDirectory.moveFileName]);
        await file.write(stringToArrayBuffer(this.id));
        this.dispatchChangeEvent();
    }
    async search(query) {
        let formData = new FormData;
        formData.append('write', new File([JSON.stringify({ query: query })], RemoteDirectory.searchFileName, { type: 'application/json' }));
        formData.append('read', RemoteDirectory.searchFileName);
        let responseData = await this.requester.request(this.urlObject, {}, formData, 'POST');
        let fileDataMap = parseJsonArrayBuffer(responseData);
        if (fileDataMap instanceof Array) {
            let results = [];
            for (let data of fileDataMap) {
                if (data.file.directory) {
                    results.push({ path: data.path, file: new RemoteDirectory(this, data.file, this.apiUrl, this.requester) });
                }
                else {
                    results.push({ path: data.path, file: new RemoteFile(this, data.file, this.apiUrl, this.requester) });
                }
            }
            return results;
        }
        else {
            throw new Error('search returned wrong data type');
        }
    }
    async addFile(data, filename, mimeType) {
        mimeType = mimeType || 'application/octet-stream';
        let addFile = await this.parent.getFile([RemoteDirectory.addFileName]);
        // Create transaction that writes to add file and then reads the metadata for the new file
        let formData = new FormData;
        formData.append('write', new File([JSON.stringify({ name: filename, type: mimeType })], RemoteDirectory.addFileName, { type: addFile.mimeType }));
        formData.append('read', RemoteDirectory.addFileName);
        let responseData = await this.requester.request(this.urlObject, {}, formData, 'POST');
        this.dispatchChangeEvent();
        let newFile = new RemoteFile(this, parseJsonArrayBuffer(responseData), this.apiUrl, this.requester);
        try {
            await newFile.write(data);
        }
        catch (e) {
            // If there is an error writing to the newly created file, delete the file
            await newFile.delete();
            throw e;
        }
        newFile.addOnChangeListener(this.dispatchChangeEvent.bind(this));
        return newFile;
    }
    async addDirectory(name) {
        let mkDirFile = await this.getFile([RemoteDirectory.addDirectoryName]);
        let formData = new FormData;
        formData.append('write', new File([JSON.stringify({ name: name })], RemoteDirectory.addDirectoryName, { type: mkDirFile.mimeType }));
        formData.append('read', RemoteDirectory.addDirectoryName);
        let responseData = await this.requester.request(this.urlObject, {}, formData, 'POST');
        this.dispatchChangeEvent();
        console.log("ABCD", parseJsonArrayBuffer(responseData));
        let dir = new RemoteDirectory(this, parseJsonArrayBuffer(responseData), this.apiUrl, this.requester);
        dir.addOnChangeListener(this.dispatchChangeEvent.bind(this));
        return dir;
    }
    async getChildren() {
        let data = await this.read();
        let fileDataArray = parseJsonArrayBuffer(data);
        let files = [];
        for (let fileData of fileDataArray) {
            let file;
            if (fileData.directory) {
                file = new RemoteDirectory(this, fileData, this.apiUrl, this.requester);
            }
            else {
                file = new RemoteFile(this, fileData, this.apiUrl, this.requester);
            }
            file.addOnChangeListener(this.dispatchChangeEvent.bind(this));
            files.push(file);
        }
        return files;
    }
}
RemoteDirectory.addDirectoryName = '.mkdir';
RemoteDirectory.addFileName = '.add';
RemoteDirectory.renameFileName = '.rename';
RemoteDirectory.deleteFileName = '.delete';
RemoteDirectory.copyFileName = '.copy';
RemoteDirectory.moveFileName = '.move';
RemoteDirectory.searchFileName = '.search';
export class RemoteFS extends RemoteDirectory {
    constructor(name, apiUrl, rootId, requester) {
        let string = apiUrl.toString();
        let normalizedApiUrl = new URL(string.endsWith("/") ? string : string + "/", window.location.href);
        super(null, {
            id: rootId,
            name: name,
            directory: true,
            mimeType: files.Directory.mimeType,
            lastModified: new Date().toISOString(),
            created: new Date().toISOString(),
            url: null,
            icon: null,
            size: 0,
        }, normalizedApiUrl, requester);
    }
    async rename(newName) {
        throw new Error('cannot rename root directory');
    }
    async delete() {
        throw new Error('cannot delete root directory');
    }
    async move(targetDirectory) {
        throw new Error('cannot delete move directory');
    }
}
