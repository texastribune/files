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
const console_1 = require("./console");
const null_1 = require("./null");
const dom_1 = require("./dom");
const files = __importStar(require("../files/base"));
const deviceFiles = [
    new console_1.ConsoleFile(),
    new null_1.NullFile()
];
class DeviceDirectory extends files.Directory {
    constructor() {
        super();
        this.created = new Date();
        this.lastModified = new Date();
        this.extra = {};
        this.extraChildren = [];
        this.extraChildren = [];
        for (let element of document.querySelectorAll('.device')) {
            if (element instanceof HTMLElement) {
                this.extraChildren.push(new dom_1.DomElementDevice(element));
            }
        }
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
exports.DeviceDirectory = DeviceDirectory;
