import * as files from "../files/base";
import { parseTextArrayBuffer, stringToArrayBuffer } from "../utils";
export class AbstractElementFile extends files.BasicFile {
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
    async delete() {
        throw new Error("can't delete element file");
    }
    async rename(newName) {
        throw new Error("can't rename element file");
    }
}
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
        return stringToArrayBuffer(event.char);
    }
    async write(data) {
        let string = parseTextArrayBuffer(data);
        for (let char of string) {
            let keydownEvent = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: char, char: char, shiftKey: false });
            let keyupEvent = new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: char, char: char, shiftKey: false });
            this.element.dispatchEvent(keydownEvent);
            this.element.dispatchEvent(keyupEvent);
        }
        return data;
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
        return stringToArrayBuffer(JSON.stringify(data));
    }
    async write(data) {
        return data;
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
        return stringToArrayBuffer(this.element.innerText).byteLength;
    }
    get mimeType() {
        return 'text/plain';
    }
    get url() {
        return `data:,${encodeURIComponent(this.element.innerText)},`;
    }
    async read(params) {
        return stringToArrayBuffer(this.element.innerText);
    }
    async write(data) {
        this.element.innerText = parseTextArrayBuffer(data);
        return data;
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
        return stringToArrayBuffer(this.element.className).byteLength;
    }
    get mimeType() {
        return 'text/plain';
    }
    get url() {
        return `data:,${encodeURIComponent(this.element.className)},`;
    }
    async read(params) {
        return stringToArrayBuffer(this.element.className);
    }
    async write(data) {
        this.element.className = parseTextArrayBuffer(data);
        return data;
    }
}
export class DomElementDevice extends files.Directory {
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
    async addFile(fileData, filename, mimeType) {
        throw new Error("can't add file to element");
    }
    async addDirectory(name) {
        let element = document.createElement(name);
        this.element.appendChild(element);
        return new DomElementDevice(element);
    }
    async getChildren() {
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
    }
    async delete() {
        if (this.element.parentElement !== null) {
            this.element.parentElement.removeChild(this.element);
        }
    }
    async rename(newName) {
        throw new Error("can't rename element");
    }
    async search(query) {
        return [];
    }
}
