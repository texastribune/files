import {AbstractDirectory, AbstractFile} from "../base.js";
import {parseTextArrayBuffer, stringToArrayBuffer} from "../../utils.js";


export class AbstractElementFile extends AbstractFile {
    constructor(element) {
        super();

        this._created = new Date();
        this._lastModified = new Date();

        this._element = element;
    }

    get id() {
        return `${this.name}-${this._element.id}`;
    }

    get icon(){
        return null;
    }

    get url(){
        return null;
    }

    get created(){
        return this._created;
    }

    get lastModified() {
        return this._lastModified;
    }
}



class AbstractEventFile extends AbstractElementFile {
    constructor(element){
        super(element);

        this._readBuffer = [];

        this._element.addEventListener(this.constructor.eventName, (event) => {
            console.log("EVENT", event);
            while (this._readBuffer.length > 0){
                let callback = this._readBuffer.shift();
                callback(event);
            }
            this._lastModified = new Date();
        }, false);
    }

    get size(){
        return 0;
    }

    static get eventName(){
        throw new Error("Event name not implemented");
    }

    /**
     *
     * @param event - The event returned by the event listener
     * @return {ArrayBuffer} - The data to return when read.
     */
    getEventData(event){
        throw new Error("getEventData not implemented.");
    }

    read(params){
        return new Promise((resolve, reject) => {
            this._readBuffer.push((event) => {
                resolve(this.getEventData(event));
            });
        });
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

    getEventData(event) {
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
        return 'application/json';
    }

    getEventData(event) {
        let data = {
            clientX: event.clientX,
            clientY: event.clientY,
            offsetX: event.offsetX,
            offsetY: event.offsetY,
            pageX: event.pageX,
            pageY: event.pageY
        };
        return stringToArrayBuffer(JSON.stringify(data));
    }

    async write(data){
        return data;
    }
}

class TextFile extends AbstractElementFile {
    constructor(element) {
        super(element);
    }

    get name(){
        return 'text';
    }

    get size(){
        return stringToArrayBuffer(this._element.innerText).byteLength;
    }

    get mimeType() {
        return 'text/plain';
    }

    get url(){
        return `data:,${encodeURIComponent(this._element.innerText)},`;
    }

    async read(params){
        return stringToArrayBuffer(this._element.innerText)
    }

    async write(data){
        this._element.innerText = parseTextArrayBuffer(data);
        return data;
    }
}

class ClassFile extends AbstractElementFile {
    constructor(element) {
        super(element);
    }

    get name(){
        return 'class';
    }

    get size(){
        return stringToArrayBuffer(this._element.className).byteLength;
    }

    get mimeType() {
        return 'text/plain';
    }

    get url(){
        return `data:,${encodeURIComponent(this._element.className)},`;
    }

    async read(params){
        return stringToArrayBuffer(this._element.className)
    }

    async write(data){
        this._element.className = parseTextArrayBuffer(data);
        return data;
    }
}


export class DomElementDevice extends AbstractDirectory {
    constructor(element){
        super();
        this._created = new Date();
        this._lastModified = new Date();

        if (element.id === ""){
            element.id = `${Math.random().toString(36).substr(2, 9)}`;
        }
        this._element = element;

        this._keyboard = new KeyboardDevice(element);
        this._mouse = new MouseDevice(element);
        this._text = new TextFile(element);
        this._class = new ClassFile(element);
    }

    get id() {
        return this._element.id;
    }

    get name(){
        return `${this._element.tagName}-${this.id}`;
    }

    get element(){
        return this._element;
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
            this._mouse,
            this._text,
            this._class
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