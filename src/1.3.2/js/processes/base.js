import {ProcessFile} from "./files.js";
import {stringToArrayBuffer} from "../utils.ts";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

// language=JavaScript
const script = `
    // wrap onmessage setup in function so that variables created (id, calls, etc.)
    // aren't in worker script scope.
    onmessage = function () {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    
        let id = 0;
        const calls = {};
    
        const system = new Proxy({}, {
            get: function (obj, sysCallName) {
                // Make a system call "prop"
                return (...args) => {
                    return new Promise((resolve, reject) => {
                        id ++;
                        calls[id] = resolve;
                        postMessage([id, sysCallName].concat(args));
                    });
                }
            }
        });
    
    
        return function(e) {
            // The onmessage callback
            if (Array.isArray(e.data)){
                // Must be the return of a system call with format ["call id", data] 
                let id = e.data[0];
                let data = e.data[1];
                let sysCall = calls[id];
                if (sysCall){
                    delete calls[id];
                    sysCall(data);
                }
            } else {
                // Must be a script to run.
                let func = new AsyncFunction('system', e.data);
                func.bind(this)(system)
                    .then(() => {
                        return system.exit("");
                    }).catch((error) => {
                        system.error(error.toString());
                        console.log(error);
                    });
            }
        };
    }();
`;

let fileDescriptorCounter = 0;

export class Process extends ProcessFile {
    constructor(parentProcess, workingDirectory, executablePathArray, stdout, stderr){
        super();

        this._parentProcess = parentProcess;
        this._workingDirectory = workingDirectory;
        this._executablePath = executablePathArray;
        this._executableName = executablePathArray[executablePathArray.length-1];

        this._stdin = this;
        this._stdout = stdout;
        this._stderr = stderr;

        this._created = new Date();
        this._lastModified = new Date();

        this._fileDescriptors = {};

        this._worker = new Worker('data:application/javascript,' + encodeURIComponent(script));

        this._worker.onmessage = (event) => {
            // sys call. Should be an array.
            let id = event.data[0];
            let name = event.data[1];
            let args = event.data.slice(2);
            let func = this.systemCalls[name].bind(this);
            if (func){
                func(...args)
                    .then((returnValue) => {
                        this._worker.postMessage([id, returnValue]);
                    })
                    .catch((error) => {
                        let buffer = stringToArrayBuffer(`System error: ${error}`);
                        this.onExit();
                        return this._stderr.write(buffer);
                    });
            } else {
                console.log(`Invalid operation ${name}`);
            }
        };

        this._workingDirectory.getFile(this._executablePath)
            .then((executableFile) => {
                return executableFile.readText();
            })
            .then((script) => {
                return this._worker.postMessage(script);
            })
            .catch((error) => {
                let buffer = stringToArrayBuffer(`File ${this._executableName} could not be executed: ${error}`);
                this.onExit();
                return this._stderr.write(buffer);
            });
    }

    get name(){
        return this._executableName;
    }

    fork(){
        return new Process(this, this._workingDirectory, this._executableName, this._stdout, this._stderr);
    }

    /**
     * An array of absolute path arrays to directories that the exec command with search in
     * when the exec method is called.
     */
    get executablePath() {
        return this._fileSystem.executablePath;
    }

    get systemCalls(){
        return {
            import: async (pathArray, variableName) => {
                // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
                // Right now executes script as function with FileSystem bound as "this". In an ideal world
                // with dynamic imports would import as a module and could use relative paths.
                let file = await this._fileSystem.getFile(pathArray);
                let scriptString = await file.readText();
                try {
                    let func = new AsyncFunction(`${scriptString};return ${variableName};`);
                    return await func.bind(this)();
                } catch (e) {
                    throw new Error(`Error importing file at ${pathArray.join('/')}: ${e}`);
                }
            },
            open: async (path) => {
                return await this.openFile(path);
            },
            close: async (fileDescriptor) => {
                this.closeFile(fileDescriptor);
            },
            read: async (fileDescriptor) => {
                let file = this.getFile(fileDescriptor);
                return await file.read();
            },
            readText: async (fileDescriptor) => {
                let file = this.getFile(fileDescriptor);
                return await file.readText();
            },
            write: async (fileDescriptor, data) => {
                let file = this.getFile(fileDescriptor);
                return await file.write(data);
            },
            fork: this.fork,
            exec: this.execPath,
            exit: async (message) => {
                let buffer = stringToArrayBuffer(message);
                await this._stdout.write(buffer);
                this.onExit();
            },
            error: async (message) => {
                let buffer = stringToArrayBuffer(`The process ${this.name} returned an error: ${message}`);
                await this._stderr.write(buffer);
                this.onExit();
            },
        }
    }

    /**
     * Execute the "main" function of the javascript file with the name given in the command parameter
     * with the given arguments. The variable "this" will be this fileSystem. The file must be located in the executable path, which is an array
     * of absolute path arrays.
     * @async
     * @param {string} command - The name of a javascript file located in the .bin directory.
     * @param {string[]} args - The arguments to be provided to the "main" function in the file.
     */
    async exec(pathArray, ...args) {
        // Find a js file with the name in command and call the "main" function
        // in the file with the given args.
        let jsName = `${command}.js`;
        let pathsArray = this.executablePath.slice(0);
        let main;
        while (main === undefined && pathsArray.length > 0) {
            let pathArray = pathsArray.shift();
            try {
                main = await this.execPath(pathArray.concat([jsName]), ...args);
            } catch (e) {
                if (!(e instanceof FileNotFoundError)) {
                    // Continue
                    throw e;
                }
            }
        }
        if (main === undefined) {
            throw new FileNotFoundError(`No file ${jsName} in path.`);
        }
        return await main.bind(this)(...args);
    }

    /**
     * Execute the "main" function of the javascript file. The variable "this" will be this fileSystem.
     * @async
     * @param {string[]} pathArray - The path of a file containing javascript to be executed.
     * @param {string[]} args - The arguments to be provided to the "main" function in the file.
     */
    async execPath(pathArray, ...args) {
        let name = pathArray.pop();
        let workingDirectory = await this._workingDirectory.getFile(pathArray);
        let process = new Process(this, workingDirectory, name, this._stdout, this._stderr);
        return process.id;
    }

    async openFile(path){
        let file = await this._workingDirectory.getFile(path);
        fileDescriptorCounter ++;
        this._fileDescriptors[fileDescriptorCounter] = file;
        return fileDescriptorCounter;
    }

    getFile(fileDescriptor){
        let file = this._fileDescriptors[fileDescriptor];
        if (file === undefined){
            throw new Error("File is not open.");
        }
        return file;
    }

    closeFile(fileDescriptor){
        delete this._fileDescriptors[fileDescriptor];
    }

    onExit(){
        this._worker.terminate();
        this.delete();
    }
}