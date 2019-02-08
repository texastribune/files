import { parseTextArrayBuffer } from "../utils";
import * as files from "../files/base";
export class ConsoleFile extends files.BasicFile {
    constructor() {
        super();
        this.created = new Date();
        this.lastModified = new Date();
        this.extra = {};
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
    async read(params) {
        return new ArrayBuffer(0);
    }
    async write(data) {
        console.log(parseTextArrayBuffer(data));
        return data;
    }
    async delete() {
        throw new Error("can't delete console");
    }
    async rename(newName) {
        throw new Error("can't rename console");
    }
}
