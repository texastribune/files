import {MemoryDirectory} from "../memory.js";
import {ConsoleFile} from "./console.js";


const deviceFiles = [
    new ConsoleFile()
];

export class DeviceDirectory extends MemoryDirectory {
    constructor(){
        super(null, 'dev');
    }

    getChildren(){
        return deviceFiles;
    }
}