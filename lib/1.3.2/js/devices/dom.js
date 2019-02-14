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
const files = __importStar(require("../files/base"));
const utils_1 = require("../utils");
class AbstractElementFile extends files.BasicFile {
    constructor(element) {
        super();
        this.created = new Date();
        this.extra = {};
        this.lastModified = new Date();
        this.element = element;
    }
    get id() {
        return `${this.name}-${this.element.id}`;
    }
    get icon() {
        return null;
    }
    get url() {
        return null;
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't delete element file");
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't rename element file");
        });
    }
}
exports.AbstractElementFile = AbstractElementFile;
class AbstractEventFile extends AbstractElementFile {
    constructor(element) {
        super(element);
        this.readBuffer = [];
        this.element.addEventListener(this.eventName, (event) => {
            console.log("EVENT", event);
            while (this.readBuffer.length > 0) {
                let callback = this.readBuffer.shift();
                if (callback !== undefined) {
                    callback(event);
                }
            }
            this.lastModified = new Date();
        }, false);
    }
    get size() {
        return 0;
    }
    get eventName() {
        return this.EVENT_NAME;
    }
    /**
     *
     * @param event - The event returned by the event listener
     * @return {ArrayBuffer} - The data to return when read.
     */
    getEventData(event) {
        throw new Error("getEventData not implemented.");
    }
    read(params) {
        return new Promise((resolve, reject) => {
            this.readBuffer.push((event) => {
                resolve(this.getEventData(event));
            });
        });
    }
}
/**
 * @property {HTMLElement} element - The element
 */
class KeyboardDevice extends AbstractEventFile {
    constructor() {
        super(...arguments);
        this.EVENT_NAME = 'keydown';
    }
    get name() {
        return 'keyboard';
    }
    get mimeType() {
        return 'text/plain';
    }
    getEventData(event) {
        return utils_1.stringToArrayBuffer(event.char);
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let string = utils_1.parseTextArrayBuffer(data);
            for (let char of string) {
                let keydownEvent = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: char, char: char, shiftKey: false });
                let keyupEvent = new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: char, char: char, shiftKey: false });
                this.element.dispatchEvent(keydownEvent);
                this.element.dispatchEvent(keyupEvent);
            }
            return data;
        });
    }
}
class MouseDevice extends AbstractEventFile {
    constructor() {
        super(...arguments);
        this.EVENT_NAME = 'click';
    }
    get name() {
        return 'mouse';
    }
    get mimeType() {
        return 'application/json';
    }
    getEventData(event) {
        let data = {
            clientX: event.clientX || null,
            clientY: event.clientY || null,
            offsetX: event.offsetX || null,
            offsetY: event.offsetY || null,
            pageX: event.pageX || null,
            pageY: event.pageY || null
        };
        return utils_1.stringToArrayBuffer(JSON.stringify(data));
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return data;
        });
    }
}
class TextFile extends AbstractElementFile {
    constructor(element) {
        super(element);
    }
    get name() {
        return 'text';
    }
    get size() {
        return utils_1.stringToArrayBuffer(this.element.innerText).byteLength;
    }
    get mimeType() {
        return 'text/plain';
    }
    get url() {
        return `data:,${encodeURIComponent(this.element.innerText)},`;
    }
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return utils_1.stringToArrayBuffer(this.element.innerText);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.element.innerText = utils_1.parseTextArrayBuffer(data);
            return data;
        });
    }
}
class ClassFile extends AbstractElementFile {
    constructor(element) {
        super(element);
    }
    get name() {
        return 'class';
    }
    get size() {
        return utils_1.stringToArrayBuffer(this.element.className).byteLength;
    }
    get mimeType() {
        return 'text/plain';
    }
    get url() {
        return `data:,${encodeURIComponent(this.element.className)},`;
    }
    read(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return utils_1.stringToArrayBuffer(this.element.className);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.element.className = utils_1.parseTextArrayBuffer(data);
            return data;
        });
    }
}
class DomElementDevice extends files.Directory {
    constructor(element) {
        super();
        this.created = new Date();
        this.lastModified = new Date();
        this.extra = {};
        if (element.id === "") {
            element.id = `${Math.random().toString(36).substr(2, 9)}`;
        }
        this.element = element;
        this.keyboard = new KeyboardDevice(element);
        this.mouse = new MouseDevice(element);
        this.text = new TextFile(element);
        this.class = new ClassFile(element);
    }
    get id() {
        return this.element.id;
    }
    get name() {
        return `${this.element.tagName.toLowerCase()}-${this.id}`;
    }
    get size() {
        return 0;
    }
    get icon() {
        return null;
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't add file to element");
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let element = document.createElement(name);
            this.element.appendChild(element);
            return new DomElementDevice(element);
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let children = [
                this.keyboard,
                this.mouse,
                this.text,
                this.class
            ];
            for (let child of this.element.children) {
                if (child instanceof HTMLElement) {
                    children.push(new DomElementDevice(child));
                }
            }
            return children;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.element.parentElement !== null) {
                this.element.parentElement.removeChild(this.element);
            }
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("can't rename element");
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
}
exports.DomElementDevice = DomElementDevice;
