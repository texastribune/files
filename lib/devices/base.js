import { ConsoleFile } from "./console.js";
import { NullFile } from "./null.js";
import { DomElementDevice } from "./dom.js";
import * as files from "../files/base.js";
const deviceFiles = [
    new ConsoleFile(),
    new NullFile()
];
export class DeviceDirectory extends files.Directory {
    constructor() {
        super();
        this.created = new Date();
        this.lastModified = new Date();
        this.extra = {};
        this.extraChildren = [];
        this.extraChildren = [
            new DomElementDevice(document.body)
        ];
    }
    get name() {
        return `dev`;
    }
    get id() {
        return 'dev';
    }
    get icon() {
        return null;
    }
    async getChildren() {
        return deviceFiles.slice().concat(this.extraChildren);
    }
    async addDirectory(name) {
        throw new Error("can't add directory to device directory");
    }
    async addFile(fileData, filename, mimeType) {
        throw new Error("can't add file to device directory");
    }
    async delete() {
        throw new Error("can't delete device directory");
    }
    async rename(newName) {
        throw new Error("can't rename device directory");
    }
    async search(query) {
        return [];
    }
}
