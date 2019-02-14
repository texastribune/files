"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_js_1 = require("../files/base.js");
let idCounter = 0;
let processes = [];
class ProcessFile extends base_js_1.BasicFile {
    constructor() {
        super();
        this._created = new Date();
        this._lastModified = new Date();
        idCounter++;
        this._id = idCounter;
        processes.push(this);
    }
    get id() {
        return this._id.toString();
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    get size() {
        return 0;
    }
    get mimeType() {
        return 'text/plain';
    }
    get created() {
        return this._created;
    }
    get lastModified() {
        return this._lastModified;
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            processes = processes.filter((file) => { return file !== this; });
        });
    }
}
exports.ProcessFile = ProcessFile;
class ProcessDirectory extends base_js_1.Directory {
    constructor() {
        super(...arguments);
        this._created = new Date();
        this._lastModified = new Date();
    }
    get id() {
        return 'proc';
    }
    get name() {
        return 'proc';
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    get created() {
        return this._created;
    }
    get lastModified() {
        return this._lastModified;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return processes.slice();
        });
    }
}
exports.ProcessDirectory = ProcessDirectory;
