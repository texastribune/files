import {AbstractDirectory, AbstractFile} from "../files/base.js";

let idCounter = 0;

let processes = [];

export class ProcessFile extends AbstractFile {
    constructor(){
        super();

        this._created = new Date();
        this._lastModified = new Date();

        idCounter ++;
        this._id = idCounter;

        processes.push(this);
    }


    get id(){
        return this._id.toString();
    }

    get url(){
        return null;
    }

    get icon(){
        return null;
    }

    get size(){
        return 0;
    }

    get mimeType(){
        return 'text/plain';
    }

    get created(){
        return this._created;
    }

    get lastModified(){
        return this._lastModified;
    }

    async delete() {
        processes = processes.filter((file) => {return file !== this});
    }
}

export class ProcessDirectory extends AbstractDirectory {
    constructor(){
        super();

        this._created = new Date();
        this._lastModified = new Date();
    }


    get id(){
        return 'proc';
    }

    get name(){
        return 'proc';
    }

    get url(){
        return null;
    }

    get icon() {
        return null;
    }

    get created(){
        return this._created;
    }

    get lastModified(){
        return this._lastModified;
    }

    async getChildren(){
        return processes.slice();
    }
}