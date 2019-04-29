var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return deviceFiles.slice().concat(this.extraChildren);
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't add directory to device directory");
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't add file to device directory");
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't delete device directory");
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't rename device directory");
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
}
