import * as files from "../files/base";
import {parseTextArrayBuffer, stringToArrayBuffer} from "../utils";
import {SearchResult} from "../files/base";


export abstract class AbstractElementFile extends files.BasicFile {
    readonly created = new Date();
    readonly extra = {};

    public lastModified = new Date();
    protected readonly element : HTMLElement;

    protected constructor(element : HTMLElement) {
        super();

        this.element = element;
    }

    get id() {
        return `${this.name}-${this.element.id}`;
    }

    get icon() : string | null {
        return null;
    }

    get url() : string | null {
        return null;
    }

    async delete(): Promise<void> {
        throw new Error("can't delete element file");
    }

    async rename(newName: string): Promise<void> {
        throw new Error("can't rename element file");
    }
}



abstract class AbstractEventFile extends AbstractElementFile {
    private readonly readBuffer : ((event : Event) => void)[] = [];

    constructor(element : HTMLElement){
        super(element);

        this.element.addEventListener(this.getEventName(), (event) => {
            while (this.readBuffer.length > 0){
                let callback = this.readBuffer.shift();
                if (callback !== undefined){
                    callback(event);
                }
            }
            this.lastModified = new Date();
        }, false);
    }

    get size(){
        return 0;
    }

    abstract getEventName() : string

    /**
     *
     * @param event - The event returned by the event listener
     * @return {ArrayBuffer} - The data to return when read.
     */
    getEventData(event : Event) : ArrayBuffer {
        throw new Error("getEventData not implemented.");
    }


    read(params?: Object): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this.readBuffer.push((event : Event) => {
                resolve(this.getEventData(event));
            });
        });
    }
}


/**
 * @property {HTMLElement} element - The element
 */
class KeyboardDevice extends AbstractEventFile {
    get name(){
        return 'keyboard';
    }

    get mimeType() {
        return 'text/plain';
    }

    getEventName(): string {
        return 'keydown';
    }

    getEventData(event : KeyboardEvent) {
        return stringToArrayBuffer(event.char);
    }

    async write(data : ArrayBuffer){
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
            this.element.dispatchEvent(keydownEvent);
            this.element.dispatchEvent(keyupEvent);
        }
        return data;
    }
}


class MouseDevice extends AbstractEventFile {
    get name(){
        return 'mouse';
    }

    get mimeType() {
        return 'application/json';
    }

    getEventName(): string {
        return 'click';
    }

    getEventData(event : MouseEvent) {
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

    async write(data : ArrayBuffer){
        return data;
    }
}

class TextFile extends AbstractElementFile {
    constructor(element : HTMLElement) {
        super(element);
    }

    get name(){
        return 'text';
    }

    get size(){
        return stringToArrayBuffer(this.element.innerText).byteLength;
    }

    get mimeType() {
        return 'text/plain';
    }

    get url(){
        return `data:,${encodeURIComponent(this.element.innerText)},`;
    }

    async read(params?: Object) : Promise<ArrayBuffer>{
        return stringToArrayBuffer(this.element.innerText)
    }

    async write(data : ArrayBuffer) : Promise<ArrayBuffer>{
        this.element.innerText = parseTextArrayBuffer(data);
        return data;
    }
}

class ClassFile extends AbstractElementFile {
    constructor(element : HTMLElement) {
        super(element);
    }

    get name(){
        return 'class';
    }

    get size(){
        return stringToArrayBuffer(this.element.className).byteLength;
    }

    get mimeType() {
        return 'text/plain';
    }

    get url(){
        return `data:,${encodeURIComponent(this.element.className)},`;
    }

    async read(params?: Object) : Promise<ArrayBuffer> {
        return stringToArrayBuffer(this.element.className)
    }

    async write(data : ArrayBuffer) : Promise<ArrayBuffer> {
        this.element.className = parseTextArrayBuffer(data);
        return data;
    }
}


export class DomElementDevice extends files.Directory {
    private readonly element : HTMLElement;
    readonly created = new Date();
    readonly lastModified = new Date();
    readonly extra = {};

    private readonly keyboard : KeyboardDevice;
    private readonly mouse : MouseDevice;
    private readonly text : TextFile;
    private readonly class : ClassFile;

    constructor(element : HTMLElement){
        super();

        if (element.id === ""){
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

    get name(){
        return `${this.element.tagName.toLowerCase()}-${this.id}`;
    }

    get size(){
        return 0;
    }

    get icon(){
        return null;
    }

    async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File> {
        throw new Error("can't add file to element")
    }

    async addDirectory(name : string): Promise<files.Directory> {
        let element = document.createElement(name);
        this.element.appendChild(element);
        return new DomElementDevice(element);
    }

    async getChildren(){
        let children : files.File[] = [
            this.keyboard,
            this.mouse,
            this.text,
            this.class
        ];
        for (let child of this.element.children){
            if (child instanceof HTMLElement){
                children.push(new DomElementDevice(child));
            }
        }
        return children;
    }

    async delete(){
        if (this.element.parentElement !== null){
            this.element.parentElement.removeChild(this.element);
        }
    }

    async rename(newName: string): Promise<void> {
        throw new Error("can't rename element");
    }

    async search(query: string): Promise<SearchResult[]> {
        return [];
    }
}