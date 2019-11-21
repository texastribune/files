var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "./base.js";
import { ajax } from "../utils.js";
export class S3Bucket {
    constructor(data) {
        this.data = data;
    }
    get name() {
        return this.data.name;
    }
    get delimiter() {
        return this.data.delimiter;
    }
    get url() {
        let url = this.data.customUrl || `https://s3.amazonaws.com/${this.data.name}`;
        if (url[url.length - 1] == "/") {
            url = url.slice(0, url.length - 1);
        }
        return url;
    }
}
export class S3File extends files.BasicFile {
    constructor(metadata, bucket) {
        super();
        this.id = metadata.Key;
        let time = new Date(metadata.LastModified);
        this.created = time;
        this.lastModified = time;
        this.extra = {
            storageClass: metadata.StorageClass,
        };
        this.icon = null;
        this.mimeType = 'application/octet-stream';
        this.size = metadata.Size;
        this.bucket = bucket;
    }
    get name() {
        let path = this.id.split(this.bucket.delimiter);
        return path[path.length - 1];
    }
    get url() {
        return `${this.bucket.url}/${this.id}`;
    }
    delete() {
        throw new Error("not implemented");
    }
    read() {
        return ajax(new URL(this.url), {}, null, 'GET');
    }
    rename(newName) {
        throw new Error("not implemented");
    }
    write(data) {
        throw new Error("not implemented");
    }
}
export class S3Directory extends files.Directory {
    constructor(prefix, bucket, maxKeys) {
        super();
        this.id = prefix;
        let time = new Date();
        this.created = time;
        this.lastModified = time;
        this.icon = null;
        this.extra = {};
        this.bucket = bucket;
        this.maxKeys = maxKeys;
    }
    get name() {
        if (this.id == "") {
            return this.bucket.name;
        }
        let prefix = this.id;
        if (prefix[prefix.length - 1] == this.bucket.delimiter) {
            prefix = prefix.slice(0, prefix.length - 1);
        }
        let path = prefix.split(this.bucket.delimiter);
        return path[path.length - 1];
    }
    addDirectory(name) {
        throw new Error("not implemented");
    }
    addFile(fileData, filename, mimeType) {
        throw new Error("not implemented");
    }
    delete() {
        throw new Error("not implemented");
    }
    getChildrenForPrefix(prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = new URL(this.bucket.url);
            url.searchParams.append('prefix', prefix);
            url.searchParams.append('encoding-type', 'url');
            url.searchParams.append('delimiter', this.bucket.delimiter);
            url.searchParams.append('list-type', '2');
            if (this.maxKeys !== null) {
                url.searchParams.append('max-keys', this.maxKeys.toString());
            }
            let response = yield fetch(url.toString());
            if (!response.ok) {
                throw new Error("bad response " + response.statusText);
            }
            let files = [];
            let text = yield response.text();
            let doc = new DOMParser().parseFromString(text, "text/xml");
            let contentElements = doc.querySelectorAll('Contents');
            let prefixElements = doc.querySelectorAll('CommonPrefixes');
            for (let prefixElement of prefixElements) {
                let prefix = prefixElement.querySelector('Prefix');
                if (prefix != null) {
                    files.push(new S3Directory(prefix.innerHTML, this.bucket, this.maxKeys));
                }
            }
            for (let contentElement of contentElements) {
                let fileData = {};
                for (let dataElement of contentElement.children) {
                    fileData[dataElement.tagName] = dataElement.innerHTML;
                }
                let s3ObjectData = {
                    Key: fileData['Key'],
                    LastModified: fileData['LastModified'],
                    Size: Number.parseInt(fileData['Size']),
                    ETag: fileData['ETag'],
                    StorageClass: fileData['StorageClass'],
                };
                files.push(new S3File(s3ObjectData, this.bucket));
            }
            return files;
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getChildrenForPrefix(this.id);
        });
    }
    rename(newName) {
        throw new Error("not implemented");
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            let files = yield this.getChildrenForPrefix(this.id + query);
            for (let file of files) {
                let pathString = file.id;
                if (this.id == pathString.slice(0, this.id.length)) {
                    pathString = pathString.slice(this.id.length, pathString.length);
                }
                let path = pathString.split(this.bucket.delimiter);
                if (path[path.length - 1] == "") {
                    path = path.slice(0, path.length - 1);
                }
                results.push({
                    file: file,
                    path: path,
                });
            }
            return results;
        });
    }
}
