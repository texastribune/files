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
const utils_1 = require("../utils");
const files = __importStar(require("../files/base"));
class ConsoleFile extends files.BasicFile {
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
            throw new Error("can't delete console");
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't rename console");
        });
    }
}
exports.ConsoleFile = ConsoleFile;
