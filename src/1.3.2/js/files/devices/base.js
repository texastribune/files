import {MemoryDirectory} from "../memory";
import {ConsoleFile} from "./console";


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