import {ConsoleFile} from "./console";
import {NullFile} from "./null";
import {DomElementDevice} from "./dom";
import * as files from "../files/base";


const deviceFiles : files.File[] = [
  new ConsoleFile(),
  new NullFile()
];

export class DeviceDirectory extends files.Directory {
    readonly created = new Date();
    readonly lastModified = new Date();
    readonly extra = {};

    private readonly extraChildren : files.File[] = [];

    constructor(){
        super();

        this.extraChildren = [];
        for (let element of document.querySelectorAll('.device')){
            if (element instanceof HTMLElement){
                this.extraChildren.push(new DomElementDevice(element));
            }
        }
    }

    get name(){
        return `dev`;
    }

    get id() {
        return 'dev';
    }

    get icon() {
        return null;
    }

    async getChildren(): Promise<files.File[]> {
        return deviceFiles.slice().concat(this.extraChildren);
    }

    async addDirectory(name: string): Promise<files.Directory> {
        throw new Error("can't add directory to device directory");
    }

    async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File> {
        throw new Error("can't add file to device directory");
    }

    async delete(): Promise<void> {
        throw new Error("can't delete device directory");
    }

    async rename(newName: string): Promise<void> {
        throw new Error("can't rename device directory");
    }

    async search(query: string): Promise<files.File[]> {
        return [];
    }
}