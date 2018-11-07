import {AbstractDirectory, AbstractFile} from "../files/base.js";


let processes = [];

export class ProcessFile extends AbstractFile {
    constructor(){
        super();

        processes.push(this);
    }


    async delete() {
        let index = processes.indexOf(this);
        processes = processes.filter((file) => {return file !== this});
    }
}

export class ProcessDirectory extends AbstractDirectory {
    constructor(){
        super();
    }


    get id(){
        return 'proc';
    }

    get name(){
        return 'proc';
    }

    getChildren(){
        return processes.slice();
    }
}