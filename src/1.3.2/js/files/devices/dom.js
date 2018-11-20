import {AbstractDirectory, AbstractFile} from "../base.js";
import {parseTextArrayBuffer, stringToArrayBuffer} from "../../utils.js";



class AbstractEventFile extends AbstractFile {
    constructor(element){
        super();

        this._created = new Date();
        this._lastModified = new Date();

        this._element = element;
        this._eventBuffer = [];
        this._readBuffer = [];

        this._element.addEventListener(this.constructor.eventName, (event) => {
            console.log("EVENT", event);
            let callback = this._readBuffer.shift();
            if (callback !== undefined){
                callback(event);
            } else {
                this._eventBuffer.push(event);
            }
            this._lastModified = new Date();
        }, false);
    }

    get id() {
        return `${this.name}-${this._element.id}`;
    }

    get created(){
        return this._created;
    }

    get lastModified() {
        return this._lastModified;
    }

    get size(){
        return 0;
    }

    get icon(){
        return null;
    }

    static get eventName(){
        throw new Error("Event name not implemented");
    }

    async getEvent(){
        let event = this._eventBuffer.shift();
        if (event === undefined){
            event = await new Promise((resolve, reject) => {
                this._readBuffer.push(resolve);
            });
        }
        return event;
    }
}


/**
 * @property {HTMLElement} element - The element
 */
class KeyboardDevice extends AbstractEventFile {
    static get eventName(){
        return 'keydown';
    }

    get name(){
        return 'keyboard';
    }

    get mimeType() {
        return 'text/plain';
    }

    async read(params) {
        let event = await this.getEvent();
        return stringToArrayBuffer(event.char);
    }

    async write(data){
        let string = parseTextArrayBuffer(data);
        for (let char of string){
            let keydownEvent = new KeyboardEvent(
                "keydown",
                {bubbles : true, cancelable : true, key : char, char : char, shiftKey : false}
            );
            let keyupEvent = new KeyboardEvent(
                "keyup",
                {bubbles : true, cancelable : true, key : char, char : char, shiftKey : false}
            );
            this._element.dispatchEvent(keydownEvent);
            this._element.dispatchEvent(keyupEvent);
        }
        return data;
    }
}


class MouseDevice extends AbstractEventFile {
    static get eventName(){
        return 'click';
    }

    get name(){
        return 'mouse';
    }

    get mimeType() {
        return 'text/plain';
    }

    async read(params) {
        let event = await this.getEvent();
        return new ArrayBuffer(0);
    }

    async write(data){
        return data;
    }
}


export class DomElementDevice extends AbstractDirectory {
    constructor(element){
        super();
        this._created = new Date();
        this._lastModified = new Date();

        if (element.id === null){
            element.id = `device-${Math.random().toString(36).substr(2, 9)}`;
        }
        this._element = element;

        this._keyboard = new KeyboardDevice(element);
        this._mouse = new MouseDevice(element);
    }

    get name(){
        return `${this._element.tagName}-${this.id}`;
    }

    get element(){
        return this._element;
    }

    get id() {
        return this._element.id;
    }

    get created(){
        return this._created;
    }

    get lastModified() {
        return this._lastModified;
    }

    get size(){
        return 0;
    }

    get icon(){
        return null;
    }

    async addFile(name, data){

    }

    async addDirectory(name){
        let element = document.createElement(name);
        return new DomElementDevice(element);
    }

    async getChildren(){
        let children = [
            this._keyboard,
            this._mouse
        ];
        for (let child of this._element.children){
            children.push(new DomElementDevice(child));
        }
        return children;
    }

    async delete(){
        this._element.parentElement.removeChild(this._element);
    }
}