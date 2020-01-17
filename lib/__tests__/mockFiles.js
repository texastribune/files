import { MemoryDirectory, MemoryFile } from "../files/memory.js";
import { fileToArrayBuffer, parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer } from "../utils.js";
import * as files from "../files/base.js";
import { FileNotFoundError } from "../files/base.js";
class MockBackendFile extends MemoryFile {
    constructor(parent, name, mimeType, data) {
        super(parent, name, mimeType, data);
        this.parent = parent;
    }
    get url() {
        return new URL(`/${this.id}`, window.location.href).toString();
    }
}
class AddFile extends MockBackendFile {
    constructor() {
        super(...arguments);
        this.newFile = null;
    }
    writeSync(data) {
        let fileData = parseJsonArrayBuffer(data);
        this.newFile = new MockBackendFile(this.parent, fileData.name, fileData.type);
        this.parent.addChild(this.newFile);
        return data;
    }
    readSync() {
        if (this.newFile === null) {
            return new ArrayBuffer(0);
        }
        return stringToArrayBuffer(JSON.stringify({
            id: this.newFile.id,
            name: this.newFile.name,
            directory: this.newFile.directory,
            mimeType: this.newFile.mimeType,
            lastModified: this.newFile.lastModified.toISOString(),
            created: this.newFile.created.toISOString(),
            url: new URL(`/${this.newFile.id}`, window.location.href).toString(),
            icon: null,
            size: this.newFile.size,
        }));
    }
}
class MkDirFile extends MockBackendFile {
    constructor() {
        super(...arguments);
        this.newDir = null;
    }
    writeSync(data) {
        let fileData = parseJsonArrayBuffer(data);
        this.newDir = new MockBackendDirectory(this.parent, fileData.name);
        this.parent.addChild(this.newDir);
        return data;
    }
    readSync() {
        if (this.newDir === null) {
            return new ArrayBuffer(0);
        }
        return stringToArrayBuffer(JSON.stringify({
            id: this.newDir.id,
            name: this.newDir.name,
            directory: this.newDir.directory,
            mimeType: this.newDir.mimeType,
            lastModified: this.newDir.lastModified.toISOString(),
            created: this.newDir.created.toISOString(),
            url: new URL(`/${this.newDir.id}`, window.location.href).toString(),
            icon: null,
            size: this.newDir.size,
        }));
    }
}
class RenameFile extends MockBackendFile {
    async write(data) {
        let fileData = parseJsonArrayBuffer(data);
        let target = await this.parent.getById(fileData.id);
        await target.rename(fileData.name);
        return data;
    }
}
class DeleteFile extends MockBackendFile {
    async write(data) {
        let id = parseTextArrayBuffer(data);
        let target = await this.parent.getById(id);
        await target.delete();
        return data;
    }
}
class CopyFile extends MockBackendFile {
    async write(data) {
        let id = parseTextArrayBuffer(data);
        let file = await this.parent.getById(id);
        await file.copy(this.parent);
        return new ArrayBuffer(0);
    }
}
class MoveFile extends MockBackendFile {
    async write(data) {
        let id = parseTextArrayBuffer(data);
        let file = await this.parent.getById(id);
        await file.move(this.parent);
        return new ArrayBuffer(0);
    }
}
class SearchFile extends MockBackendFile {
    constructor() {
        super(...arguments);
        this.lastResult = [];
    }
    writeSync(data) {
        let searchData = parseJsonArrayBuffer(data);
        this.lastResult = this.parent.searchSync(searchData.query);
        return new ArrayBuffer(0);
    }
    readSync() {
        let data = [];
        for (let searchData of this.lastResult) {
            data.push({
                path: searchData.path,
                file: {
                    id: searchData.file.id,
                    name: searchData.file.name,
                    directory: searchData.file.directory,
                    mimeType: searchData.file.mimeType,
                    lastModified: searchData.file.lastModified.toISOString(),
                    created: searchData.file.created.toISOString(),
                    url: new URL(`/${searchData.file.id}`, window.location.href).toString(),
                    icon: null,
                    size: searchData.file.size,
                }
            });
        }
        return stringToArrayBuffer(JSON.stringify(data));
    }
}
export class MockBackendDirectory extends MemoryDirectory {
    constructor() {
        super(...arguments);
        this.apiChildren = [
            new AddFile(this, MockBackendDirectory.addFileName),
            new MkDirFile(this, MockBackendDirectory.addDirectoryName),
            new RenameFile(this, MockBackendDirectory.renameFileName),
            new DeleteFile(this, MockBackendDirectory.deleteFileName),
            new CopyFile(this, MockBackendDirectory.copyFileName),
            new MoveFile(this, MockBackendDirectory.moveFileName),
            new SearchFile(this, MockBackendDirectory.searchFileName),
        ];
    }
    get url() {
        return new URL(`/${this.id}`, window.location.href).toString();
    }
    async getDirChildById(file, id) {
        if (file.id === id) {
            return file;
        }
        if (file instanceof files.Directory) {
            for (let child of await file.getChildren()) {
                let found = await this.getDirChildById(child, id);
                if (found !== null) {
                    return found;
                }
            }
        }
        return null;
    }
    async getById(id) {
        let file = await this.getDirChildById(this, id);
        if (file === null) {
            throw new FileNotFoundError(`no file with id ${id}`);
        }
        return file;
    }
    async getChildren() {
        let children = await super.getChildren();
        return children.concat(this.apiChildren);
    }
    addFileSync(fileData, filename, mimeType) {
        let newFile = new MockBackendFile(this, filename, mimeType, fileData);
        this.addChild(newFile);
        return newFile;
    }
    addDirectorySync(name) {
        let newDir = new MockBackendDirectory(this, name);
        this.addChild(newDir);
        return newDir;
    }
}
MockBackendDirectory.addDirectoryName = '.mkdir';
MockBackendDirectory.addFileName = '.add';
MockBackendDirectory.renameFileName = '.rename';
MockBackendDirectory.deleteFileName = '.delete';
MockBackendDirectory.copyFileName = '.copy';
MockBackendDirectory.moveFileName = '.move';
MockBackendDirectory.searchFileName = '.search';
export class MockRemoteRequester {
    constructor(rootDirectory) {
        this.rootDirectory = rootDirectory;
    }
    getId(url) {
        let s = url.pathname.substring(url.pathname.lastIndexOf('/'));
        if (s[0] === '/') {
            s = s.slice(1);
        }
        return s;
    }
    async request(url, query, data, method) {
        let id = this.getId(url);
        const requestedFile = await this.rootDirectory.getById(id);
        if (requestedFile === null) {
            throw new Error("404 file does not exist");
        }
        if (data instanceof FormData && requestedFile instanceof files.Directory) {
            let resp = new ArrayBuffer(0);
            let formData = [];
            data.forEach((formDataEntry, name) => {
                formData.push({
                    name: name,
                    value: formDataEntry,
                });
            });
            for (let entry of formData) {
                if (entry.name === "write") {
                    if (entry.value instanceof File) {
                        let data = await fileToArrayBuffer(entry.value);
                        let f = await requestedFile.getFile([entry.value.name]);
                        await f.write(data);
                    }
                }
                else if (entry.name === "read") {
                    if (typeof entry.value === "string") {
                        let f = await requestedFile.getFile([entry.value]);
                        resp = await f.read();
                    }
                }
            }
            return resp;
        }
        else {
            method = method || "GET";
            if (method === "GET") {
                return requestedFile.read();
            }
            else if (method === "POST" && data) {
                let buf = await fileToArrayBuffer(data);
                return await requestedFile.write(buf);
            }
        }
        throw new Error("method not allowed");
    }
}
