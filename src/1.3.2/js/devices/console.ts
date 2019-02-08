import {parseTextArrayBuffer} from "../utils";
import * as files from "../files/base";


export class ConsoleFile extends files.BasicFile {
    readonly created = new Date();
    readonly lastModified = new Date();
    readonly extra = {};

    constructor(){
        super();
    }

    get id() {
        return 'console';
    }

    get name() {
        return 'console';
    }

    get icon() {
        return null;
    }

    get url() {
        return null;
    }

    get mimeType() {
        return 'text/plain';
    }

    get size() {
        return 0;
    }

    async read(params?: Object) : Promise<ArrayBuffer>{
        return new ArrayBuffer(0);
    }

    async write(data : ArrayBuffer) : Promise<ArrayBuffer> {
        console.log(parseTextArrayBuffer(data));
        return data;
    }

    async delete(): Promise<void> {
        throw new Error("can't delete console");
    }

    async rename(newName: string): Promise<void> {
        throw new Error("can't rename console");
    }
}