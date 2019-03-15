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
const webdav_1 = require("webdav");
const files = __importStar(require("./base"));
class WebDavFile extends files.BasicFile {
    constructor(client, stat) {
        super();
        this.extra = {};
        this.client = client;
        this.stat = stat;
    }
    get id() {
        return this.stat.filename;
    }
    get name() {
        return this.stat.basename;
    }
    get mimeType() {
        return this.stat.type;
    }
    get lastModified() {
        return new Date(this.stat.lastmod);
    }
    get created() {
        return new Date(this.stat.lastmod);
    }
    get url() {
        return this.client.getFileDownloadLink(this.stat.filename);
    }
    get icon() {
        return null;
    }
    get size() {
        return Number.parseInt(this.stat.size);
    }
    read() {
        return this.client.createReadStream(this.stat.filename);
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.createWriteStream(this.stat.filename);
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    delete() {
        return this.client.deleteFile(this.stat.filename);
    }
}
class WebDavDirectory extends files.Directory {
    constructor(client, stat) {
        super();
        this.extra = {};
        this.client = client;
        this.stat = stat;
    }
    get id() {
        return this.stat.filename;
    }
    get name() {
        return this.stat.basename;
    }
    get lastModified() {
        return new Date(this.stat.lastmod);
    }
    get created() {
        return new Date(this.stat.lastmod);
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    get size() {
        return Number.parseInt(this.stat.size);
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    delete() {
        return this.client.deleteFile(this.stat.filename);
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            let path = this.stat.filename + '/' + filename;
            yield this.client.putFileContents(path, fileData);
            let stat = yield this.client.stat(path);
            return new WebDavFile(this.client, stat);
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let path = this.stat.filename + '/' + name;
            yield this.client.createDirectory(path);
            let stat = yield this.client.stat(path);
            return new WebDavDirectory(this.client, stat);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let stats = yield this.client.getDirectoryContents(this.stat.filename);
            let files = [];
            for (let stat of stats) {
                if (stat.type === 'directory') {
                    files.push(new WebDavDirectory(this.client, stat));
                }
                else {
                    files.push(new WebDavFile(this.client, stat));
                }
            }
            return files;
        });
    }
}
class WebDavRoot extends WebDavDirectory {
    constructor(url, path) {
        let client = webdav_1.createClient(url);
        super(client, {
            filename: path,
            basename: 'root',
            lastmod: new Date().toISOString(),
            size: "0",
            type: 'directory',
            etag: null,
        });
    }
}
exports.WebDavRoot = WebDavRoot;
