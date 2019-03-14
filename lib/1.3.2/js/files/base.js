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
const utils_1 = require("../utils");
class FileNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.FileNotFoundError = FileNotFoundError;
class FileAlreadyExistsError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.FileAlreadyExistsError = FileAlreadyExistsError;
/**
 * @abstract
 * An object representing a file.
 */
class BasicFile {
    constructor() {
        this.onChangeListeners = new Set();
    }
    /**
     * Call whenever a file is changed.
     */
    onChange() {
        for (let listener of this.onChangeListeners) {
            listener(this);
        }
    }
    addOnChangeListener(listener) {
        this.onChangeListeners.add(listener);
    }
    removeOnChangeListener(listener) {
        this.onChangeListeners.delete(listener);
    }
    get directory() {
        return false;
    }
    /**
     * Read the file as a string.
     * @async
     * @param {Object} [params={}] - Read parameters.
     * @returns {string} - File file data converted to a string.
     */
    readText(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let arrayBuffer = yield this.read(params);
            return utils_1.parseTextArrayBuffer(arrayBuffer);
        });
    }
    /**
     * Read the file as a json encoded string and convert to a Javascript Object.
     * @async
     * @param {Object} [params={}] - Read parameters.
     * @returns {Object|Array} - File file data converted to a Javascript Object.
     */
    readJSON(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let arrayBuffer = yield this.read(params);
            return utils_1.parseJsonArrayBuffer(arrayBuffer);
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            yield targetDirectory.write(yield this.read());
        });
    }
    move(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.copy(targetDirectory);
            yield this.delete();
        });
    }
    toString() {
        return this.name;
    }
}
exports.BasicFile = BasicFile;
/**
 * An object representing a directory.
 */
class Directory extends BasicFile {
    static get mimeType() {
        return 'application/json';
    }
    get directory() {
        return true;
    }
    get mimeType() {
        return Directory.mimeType;
    }
    get size() {
        return 0;
    }
    get url() {
        return null;
    }
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileData = [];
            let children = yield this.getChildren();
            for (let child of children) {
                fileData.push({
                    id: child.id,
                    name: child.name,
                    directory: child.directory,
                    url: child.url,
                    icon: child.icon,
                    size: child.size,
                    mimeType: child.mimeType,
                    lastModified: child.lastModified.toISOString(),
                    created: child.created.toISOString(),
                    extra: child.extra
                });
            }
            let jsonString = JSON.stringify(fileData);
            return utils_1.stringToArrayBuffer(jsonString);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Cannot write to a directory.");
        });
    }
    /**
     * Get the file object at the given path relative to this directory.
     * @returns {Promise<File>} - The file object located at the given path.
     * @throws FileNotFoundError
     */
    getFile(pathArray) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pathArray.length === 0) {
                return this;
            }
            let name = pathArray[pathArray.length - 1];
            let parentPath = pathArray.slice(0, pathArray.length - 1);
            let parentFile = yield this.getFile(parentPath);
            let fileObjectsArray;
            if (parentFile instanceof Directory) {
                fileObjectsArray = yield parentFile.getChildren();
            }
            else {
                throw new FileNotFoundError(`File ${name} not found.`);
            }
            let matchingFile;
            while (matchingFile === undefined) {
                let fileObject = fileObjectsArray.pop();
                if (fileObject === undefined) {
                    throw new FileNotFoundError(`File ${name} not found.`);
                }
                if (fileObject.name === name) {
                    matchingFile = fileObject;
                }
            }
            return matchingFile;
        });
    }
}
exports.Directory = Directory;
