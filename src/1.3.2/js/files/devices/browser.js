import {AbstractFile} from "../base.js";
import {FileBrowser} from "../../ui/browser.js";
import {parseJsonArrayBuffer} from "../../utils.js";


let browserCount = 0;

export class FileBrowserDevice extends AbstractFile {
    constructor(directory, element, name) {
        super();

        this._element = element;
        this._name = name;

        this._created = new Date();
        this._lastModified = new Date();

        this._browser = new FileBrowser(directory);
        this._element.appendChild(this._browser.element);

        browserCount ++;
        this._id = `browser-${this._element.id}`;
    }

    get id() {
        return this._id;
    }

    get name(){
        return this._name;
    }

    get mimeType(){
        return 'application/json';
    }

    get size(){
        return 0;
    }

    get url(){
        return null;
    }

    get icon(){
        return null;
    }

    get created(){
        return this._created;
    }

    get lastModified() {
        return this._lastModified;
    }

    async read(params){
        return JSON.stringify(this._browser.path);
    }

    async write(data){
        console.log("SET PATH", data);
        this._browser.path = parseJsonArrayBuffer(data);
        return data;
    }
}