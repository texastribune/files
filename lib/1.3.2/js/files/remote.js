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
const utils_1 = require("../utils");
const REQUEST_TIMEOUT = 30;
function getCookie(name) {
    let parts = document.cookie.split(`${name}=`);
    if (parts.length > 1) {
        parts = parts[1].split(';');
        return parts[0] || null;
    }
    return null;
}
function encodeQueryData(data) {
    let ret = [];
    for (let d in data) {
        if (data.hasOwnProperty(d)) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
        }
    }
    return '?' + ret.join('&');
}
function isCrossDomain(url) {
    let a = document.createElement("a");
    a.href = url;
    return window.location.protocol + '//' + window.location.host !==
        a.protocol + '//' + a.host;
}
function ajax(url, query, data, method) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("URL", url);
        return yield new Promise((resolve, reject) => {
            data = data || null;
            query = query || {};
            method = method || 'GET';
            if (method === 'GET' || method === 'DELETE') {
                url = url + encodeQueryData(query);
            }
            let request = new XMLHttpRequest();
            request.responseType = "arraybuffer";
            request.onreadystatechange = () => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 0) {
                        reject("An error has occurred");
                    }
                    else {
                        let contentType = request.getResponseHeader('content-type');
                        if (request.status >= 200 && request.status < 400) {
                            resolve(request.response);
                        }
                        else {
                            let errorText = utils_1.parseTextArrayBuffer(request.response);
                            let errorMessage = `${request.status} error: `;
                            if (contentType === 'application/json') {
                                try {
                                    let errorJson = JSON.parse(errorText);
                                    for (let key in errorJson) {
                                        errorMessage += `${key} - ${errorJson[key]}. `;
                                    }
                                    reject(new Error(errorMessage));
                                }
                                catch (e) {
                                    reject("Error parsing response.");
                                }
                            }
                            else {
                                errorMessage += errorText;
                                reject(new Error(errorMessage));
                            }
                        }
                    }
                }
            };
            request.open(method, url, true);
            request.timeout = REQUEST_TIMEOUT * 1000;
            if (!isCrossDomain(url)) {
                request.withCredentials = true;
                let cookie = getCookie("csrftoken");
                if (cookie !== null) {
                    request.setRequestHeader("X-CSRFToken", cookie);
                }
            }
            request.send(data);
        });
    });
}
class RemoteFile extends files.BasicFile {
    constructor(parent, fileData) {
        super();
        this.extra = {};
        this.parent = parent;
        this.fileData = fileData;
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
    get url() {
        return 'http://localhost:8000' + this.fileData.url;
    }
    get icon() {
        return this.fileData.icon;
    }
    get size() {
        return this.fileData.size;
    }
    read() {
        return ajax(this.url, {}, null, 'GET');
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield ajax(this.url, {}, new Blob([data], { type: this.mimeType }), 'POST');
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = new FormData;
            data.append('id', this.id);
            data.append('to', newName);
            let file = yield this.parent.getFile([RemoteDirectory.renameFileName]);
            yield file.write(data);
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.parent.getFile([RemoteDirectory.deleteFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
        });
    }
}
class RemoteDirectory extends files.Directory {
    constructor(parent, fileData) {
        super();
        this.extra = {};
        this.parent = parent;
        this.fileData = fileData;
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
    get url() {
        return 'http://localhost:8000' + this.fileData.url;
    }
    get icon() {
        return this.fileData.icon;
    }
    get size() {
        return this.fileData.size;
    }
    read() {
        return ajax(this.url, {}, null, 'GET');
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = new FormData;
            data.append('id', this.id);
            data.append('to', newName);
            if (this.parent == null) {
                throw new Error('cannot rename root directory');
            }
            let file = yield this.parent.getFile([RemoteDirectory.renameFileName]);
            yield file.write(data);
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent == null) {
                throw new Error('cannot delete root directory');
            }
            let file = yield this.parent.getFile([RemoteDirectory.deleteFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.getFile([RemoteDirectory.searchFileName]);
            let data = yield file.read();
            let fileDataMap = utils_1.parseJsonArrayBuffer(data);
            if (fileDataMap instanceof Array) {
                let files = [];
                for (let data of fileDataMap) {
                    if (data.directory) {
                        files.push(new RemoteDirectory(this, data));
                    }
                    else {
                        files.push(new RemoteFile(this, data));
                    }
                }
                return [];
            }
            else {
                throw new Error('search returned wrong data type');
            }
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = new FormData;
            data.append('file', new Blob([fileData], { type: mimeType }));
            if (filename) {
                data.append('name', filename);
            }
            let file = yield this.getFile([RemoteDirectory.addFileName]);
            let newData = yield file.write(data);
            return new RemoteFile(this, utils_1.parseJsonArrayBuffer(newData));
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.getFile([RemoteDirectory.addDirectoryName]);
            let newData = yield file.write(utils_1.stringToArrayBuffer(name));
            return new RemoteDirectory(this, utils_1.parseJsonArrayBuffer(newData));
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.read();
            let fileDataMap = utils_1.parseJsonArrayBuffer(data);
            console.log("DATA", fileDataMap);
            let files = [];
            for (let name in fileDataMap) {
                if (fileDataMap.hasOwnProperty(name)) {
                    let fileData = fileDataMap[name];
                    fileData.name = name;
                    if (fileData.directory) {
                        files.push(new RemoteDirectory(this, fileData));
                    }
                    else {
                        files.push(new RemoteFile(this, fileData));
                    }
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
RemoteDirectory.moveFileName = '.move';
RemoteDirectory.searchFileName = '.search';
class RemoteFS extends RemoteDirectory {
    constructor(url) {
        super(null, {
            id: url,
            name: 'root',
            directory: true,
            mimeType: files.Directory.mimeType,
            lastModified: new Date().toISOString(),
            created: new Date().toISOString(),
            url: url,
            icon: null,
            size: 0,
        });
    }
}
exports.RemoteFS = RemoteFS;
