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
const base_1 = require("../files/base");
class NullFile extends base_1.BasicFile {
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
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return new ArrayBuffer(0);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return data;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't rename null file");
        });
    }
}
exports.NullFile = NullFile;
