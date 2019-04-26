var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer } from "../utils";
export class FileNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
export class FileAlreadyExistsError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
/**
 * @abstract
 * An object representing a file.
 */
export class BasicFile {
    constructor() {
        this.onChangeListeners = new Set();
    }
    /**
     * Call whenever a file is changed.
     */
    dispatchChangeEvent() {
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
     * @returns {string} - File file data converted to a string.
     */
    readText() {
        return __awaiter(this, void 0, void 0, function* () {
            let arrayBuffer = yield this.read();
            return parseTextArrayBuffer(arrayBuffer);
        });
    }
    /**
     * Read the file as a json encoded string and convert to a Javascript Object.
     * @async
     * @returns {Object|Array} - File file data converted to a Javascript Object.
     */
    readJSON() {
        return __awaiter(this, void 0, void 0, function* () {
            let arrayBuffer = yield this.read();
            return parseJsonArrayBuffer(arrayBuffer);
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.read();
            yield targetDirectory.addFile(data, this.name, this.mimeType);
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
/**
 * An object representing a directory.
 */
export class Directory extends BasicFile {
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
    read() {
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
            return stringToArrayBuffer(jsonString);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Cannot write to a directory.");
        });
    }
    copy(targetDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            let copy = yield targetDirectory.addDirectory(this.name);
            for (let child of yield this.getChildren()) {
                yield child.copy(copy);
            }
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
