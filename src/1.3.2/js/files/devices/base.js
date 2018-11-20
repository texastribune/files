import {ConsoleFile} from "./console.js";
import {NullFile} from "./null.js";
import {DomElementDevice} from "./dom.js";
import {AbstractDirectory} from "../base.js";


const deviceFiles = [
  new ConsoleFile(),
  new NullFile()
];

for (let element of document.querySelectorAll('.device')){
    deviceFiles.push(new DomElementDevice(element));
}

export class DeviceDirectory extends AbstractDirectory {
    constructor(){
        super();
        this._created = new Date();
        this._lastModified = new Date();
    }

    get name(){
        return `dev`;
    }

    get id() {
        return 'dev';
    }

    get created(){
        return this._created;
    }

    get lastModified() {
        return this._lastModified;
    }


    async getChildren(){
        console.log("CHILD", this);
        return deviceFiles.slice();
    }
}