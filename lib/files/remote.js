var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "./base.js";
import { parseJsonArrayBuffer, ajax, stringToArrayBuffer } from "../utils.js";
class RemoteFile extends files.BasicFile {
    constructor(parent, fileData, apiUrl) {
        super();
        this.extra = {};
        this.parent = parent;
        this.fileData = fileData;
        this.apiUrl = apiUrl;
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
    read() {
        return ajax(this.urlObject, {}, null, 'GET');
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield ajax(this.urlObject, {}, new Blob([data], { type: this.mimeType }), 'POST');
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = new FormData;
            data.append('id', this.id);
            data.append('name', newName);
            let file = yield this.parent.getFile([RemoteDirectory.renameFileName]);
            yield file.write(stringToArrayBuffer(JSON.stringify({
                id: this.id,
                name: newName,
            })));
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.parent.getFile([RemoteDirectory.deleteFileName]);
            yield file.write(stringToArrayBuffer(this.id));
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.copyFileName]);
            yield file.write(stringToArrayBuffer(this.id));
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.moveFileName]);
            yield file.write(stringToArrayBuffer(this.id));
        });
    }
}
class RemoteDirectory extends files.Directory {
    constructor(parent, fileData, apiUrl) {
        super();
        this.extra = {};
        if (parent === null) {
            if (this instanceof RemoteFS) {
                this.parent = this;
            }
            else {
                this.parent = new RemoteFS('root', apiUrl);
            }
        }
        else {
            this.parent = parent;
        }
        this.fileData = fileData;
        this.apiUrl = apiUrl;
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
    read() {
        return ajax(this.urlObject, {}, null, 'GET');
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = new FormData;
            data.append('id', this.id);
            data.append('name', newName);
            let file = yield this.parent.getFile([RemoteDirectory.renameFileName]);
            yield file.write(stringToArrayBuffer(JSON.stringify({
                id: this.id,
                name: newName,
            })));
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.parent.getFile([RemoteDirectory.deleteFileName]);
            yield file.write(stringToArrayBuffer(this.id));
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.copyFileName]);
            yield file.write(stringToArrayBuffer(this.id));
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.moveFileName]);
            yield file.write(stringToArrayBuffer(this.id));
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let formData = new FormData;
            formData.append('write', new File([JSON.stringify({ query: query })], RemoteDirectory.searchFileName, { type: 'application/json' }));
            formData.append('read', RemoteDirectory.searchFileName);
            let responseData = yield ajax(this.urlObject, {}, formData, 'POST');
            let fileDataMap = parseJsonArrayBuffer(responseData);
            if (fileDataMap instanceof Array) {
                let results = [];
                for (let data of fileDataMap) {
                    if (data.file.directory) {
                        results.push({ path: data.path, file: new RemoteDirectory(this, data.file, this.apiUrl) });
                    }
                    else {
                        results.push({ path: data.path, file: new RemoteFile(this, data.file, this.apiUrl) });
                    }
                }
                return results;
            }
            else {
                throw new Error('search returned wrong data type');
            }
        });
    }
    addFile(data, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            mimeType = mimeType || 'application/octet-stream';
            let addFile = yield this.parent.getFile([RemoteDirectory.addFileName]);
            // Create transaction that writes to add file and then reads the metadata for the new file
            let formData = new FormData;
            formData.append('write', new File([JSON.stringify({ name: filename, type: mimeType })], RemoteDirectory.addFileName, { type: addFile.mimeType }));
            formData.append('read', RemoteDirectory.addFileName);
            let responseData = yield ajax(this.urlObject, {}, formData, 'POST');
            let newFile = new RemoteFile(this, parseJsonArrayBuffer(responseData), this.apiUrl);
            try {
                yield newFile.write(data);
            }
            catch (e) {
                // If there is an error writing to the newly created file, delete the file
                yield newFile.delete();
                throw e;
            }
            return newFile;
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let mkDirFile = yield this.getFile([RemoteDirectory.addDirectoryName]);
            let formData = new FormData;
            formData.append('write', new File([JSON.stringify({ name: name })], RemoteDirectory.addDirectoryName, { type: mkDirFile.mimeType }));
            formData.append('read', RemoteDirectory.addDirectoryName);
            let responseData = yield ajax(this.urlObject, {}, formData, 'POST');
            return new RemoteDirectory(this, parseJsonArrayBuffer(responseData), this.apiUrl);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.read();
            let fileDataArray = parseJsonArrayBuffer(data);
            let files = [];
            for (let fileData of fileDataArray) {
                if (fileData.directory) {
                    files.push(new RemoteDirectory(this, fileData, this.apiUrl));
                }
                else {
                    files.push(new RemoteFile(this, fileData, this.apiUrl));
                }
            }
            return files;
        });
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
    constructor(name, apiUrl) {
        let string = apiUrl.toString();
        let normalizedApiUrl = new URL(string.endsWith("/") ? string : string + "/", window.location.href);
        super(null, {
            id: 'root',
            name: name,
            directory: true,
            mimeType: files.Directory.mimeType,
            lastModified: new Date().toISOString(),
            created: new Date().toISOString(),
            url: null,
            icon: null,
            size: 0,
        }, normalizedApiUrl);
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('cannot rename root directory');
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('cannot delete root directory');
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('cannot delete move directory');
        });
    }
}
