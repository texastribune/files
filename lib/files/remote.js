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
    return window.location.protocol + '//' + window.location.host !==
        url.protocol + '//' + url.host;
}
function ajax(url, query, data, method) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise((resolve, reject) => {
            data = data || null;
            query = query || {};
            method = method || 'GET';
            if (method === 'GET' || method === 'DELETE') {
                for (let name in query) {
                    url.searchParams.append(name, query[name]);
                }
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
                            let errorMessage = `${request.status} response`;
                            if (contentType === 'application/json') {
                                try {
                                    let errorJson = JSON.parse(errorText);
                                    for (let key in errorJson) {
                                        errorMessage += `: ${key} - ${errorJson[key]}. `;
                                    }
                                    reject(new Error(errorMessage));
                                }
                                catch (e) {
                                    reject("Error parsing response.");
                                }
                            }
                            else if (contentType === 'text/html') {
                                reject(new Error(errorMessage));
                            }
                            else {
                                errorMessage += errorText;
                                reject(new Error(errorMessage));
                            }
                        }
                    }
                }
            };
            request.open(method, url.toString(), true);
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
    get url() {
        return this.fileData.url || this.apiUrl.toString() + this.id;
    }
    get icon() {
        return this.fileData.icon;
    }
    get size() {
        return this.fileData.size;
    }
    read() {
        return ajax(new URL(this.url), {}, null, 'GET');
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield ajax(new URL(this.url), {}, new Blob([data], { type: this.mimeType }), 'POST');
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = new FormData;
            data.append('id', this.id);
            data.append('name', newName);
            let file = yield this.parent.getFile([RemoteDirectory.renameFileName]);
            yield file.write(utils_1.stringToArrayBuffer(JSON.stringify({
                id: this.id,
                name: newName,
            })));
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.parent.getFile([RemoteDirectory.deleteFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.copyFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.moveFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
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
                this.parent = new RemoteFS(apiUrl);
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
    get url() {
        return this.fileData.url || this.apiUrl.toString() + this.id;
    }
    get icon() {
        return this.fileData.icon;
    }
    get size() {
        return this.fileData.size;
    }
    read() {
        return ajax(new URL(this.url), {}, null, 'GET');
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent instanceof RemoteFS) {
                throw new Error('cannot rename root directory');
            }
            let data = new FormData;
            data.append('id', this.id);
            data.append('name', newName);
            let file = yield this.parent.getFile([RemoteDirectory.renameFileName]);
            yield file.write(utils_1.stringToArrayBuffer(JSON.stringify({
                id: this.id,
                name: newName,
            })));
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.parent instanceof RemoteFS) {
                throw new Error('cannot delete root directory');
            }
            let file = yield this.parent.getFile([RemoteDirectory.deleteFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.copyFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield targetDirectory.getFile([RemoteDirectory.moveFileName]);
            yield file.write(utils_1.stringToArrayBuffer(this.id));
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let formData = new FormData;
            formData.append('write', new File([JSON.stringify({ query: query })], RemoteDirectory.searchFileName, { type: 'application/json' }));
            formData.append('read', RemoteDirectory.searchFileName);
            let responseData = yield ajax(new URL(this.url), {}, formData, 'POST');
            let fileDataMap = utils_1.parseJsonArrayBuffer(responseData);
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
            let formData = new FormData;
            formData.append('write', new File([JSON.stringify({ name: filename, type: mimeType })], RemoteDirectory.addFileName, { type: addFile.mimeType }));
            formData.append('read', RemoteDirectory.addFileName);
            let responseData = yield ajax(new URL(this.url), {}, formData, 'POST');
            let newFile = new RemoteFile(this, utils_1.parseJsonArrayBuffer(responseData), this.apiUrl);
            yield newFile.write(data);
            return newFile;
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let mkDirFile = yield this.getFile([RemoteDirectory.addDirectoryName]);
            let formData = new FormData;
            formData.append('write', new File([JSON.stringify({ name: name })], RemoteDirectory.addDirectoryName, { type: mkDirFile.mimeType }));
            formData.append('read', RemoteDirectory.addDirectoryName);
            let responseData = yield ajax(new URL(this.url), {}, formData, 'POST');
            return new RemoteDirectory(this, utils_1.parseJsonArrayBuffer(responseData), this.apiUrl);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.read();
            let fileDataArray = utils_1.parseJsonArrayBuffer(data);
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
class RemoteFS extends RemoteDirectory {
    constructor(apiUrl) {
        let string = apiUrl.toString();
        let normalizedApiUrl = new URL(string.endsWith("/") ? string : string + "/", window.location.href);
        super(null, {
            id: 'root',
            name: 'root',
            directory: true,
            mimeType: files.Directory.mimeType,
            lastModified: new Date().toISOString(),
            created: new Date().toISOString(),
            url: null,
            icon: null,
            size: 0,
        }, normalizedApiUrl);
    }
    changeUrl(url) {
        let string = url.toString();
        this.apiUrl = new URL(string.endsWith("/") ? string : string + "/", window.location.href);
        this.dispatchChangeEvent();
    }
}
exports.RemoteFS = RemoteFS;
