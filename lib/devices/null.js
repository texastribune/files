import { BasicFile } from "../files/base.js";
export class NullFile extends BasicFile {
    constructor() {
        super();
        this.created = new Date();
        this.lastModified = new Date();
        this.extra = {};
    }
    get id() {
        return 'null';
    }
    get name() {
        return 'null';
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
    async read() {
        return new ArrayBuffer(0);
    }
    async write(data) {
        return data;
    }
    async delete() {
    }
    async rename(newName) {
        throw new Error("can't rename null file");
    }
}
