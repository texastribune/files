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
const base_1 = require("./base");
const utils_1 = require("../utils");
class StaticFile extends base_1.BasicFile {
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
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return new ArrayBuffer(0);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(utils_1.parseTextArrayBuffer(data));
            return data;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            this._parent.removeChild(this);
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            this._name = newName;
        });
    }
}
