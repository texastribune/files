import {Directory, BasicFile} from "../files/base.js";

let idCounter = 0;

let processes : ProcessFile[] = [];

export abstract class ProcessFile extends BasicFile {
    private readonly _id : number;
    private readonly _created = new Date();
    private _lastModified = new Date();
    public readonly extra = {};

    protected constructor(){
        super();

        idCounter ++;
        this._id = idCounter;

        console.log("PUSH", this);
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
        console.log("DELETE");
        console.trace();
        processes = processes.filter((file) => {return file !== this});
    }
}

export abstract class ProcessDirectory extends Directory {
    private readonly _created = new Date();
    private _lastModified = new Date();

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
        console.log("PROC CHILD", processes.slice());
        return processes.slice();
    }
}