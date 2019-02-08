import { BasicFile } from "./base";
import { parseTextArrayBuffer } from "../utils";
class StaticFile extends BasicFile {
    constructor(path) {
        super();
        this._path = path;
    }
    get id() {
        return 'console';
    }
    get name() {
        return 'console';
    }
    get icon() {
        return null;
    }
    get url() {
        return null;
    }
    get mimeType() {
        return 'text/plain';
    }
    get size() {
        return 0;
    }
    get lastModified() {
        return this._lastModified;
    }
    get created() {
        return this._created;
    }
    async read(params) {
        return new ArrayBuffer(0);
    }
    async write(data) {
        console.log(parseTextArrayBuffer(data));
        return data;
    }
    async delete() {
        this._parent.removeChild(this);
    }
    async rename(newName) {
        this._name = newName;
    }
}
