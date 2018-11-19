import {MemoryDirectory} from "../memory.js";
import {ConsoleFile} from "./console.js";
import {NullFile} from "./null.js";


const deviceFiles = [
  new ConsoleFile(),
  new NullFile()
];

export class DeviceDirectory extends MemoryDirectory {
    constructor(){
        super(null, 'dev');
    }

    async getChildren(){
        return deviceFiles.slice();
    }
}