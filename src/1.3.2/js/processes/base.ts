import {ProcessFile} from "./files";
import {parseTextArrayBuffer, stringToArrayBuffer} from "../utils";
import {File, Directory} from "../files/base";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

type syscallTable = {
    open: (pathArray : string[]) => Promise<number>,
    close: (fileDescriptor : number) => void,
    read: (fileDescriptor : number) => Promise<ArrayBuffer>,
    import: (pathArray : string[], variableName : string) => Promise<any>,
    write: (fileDescriptor : number, data : ArrayBuffer) => Promise<ArrayBuffer>,
    fork: () => Promise<number>,
    exec: (pathArray : string[], ...args : string[]) => Promise<number>,
    exit: (message : string) => void,
    error: (message : string) => void
}

interface WorkerEvent extends Event {
    data: [number, "open" | "close" | "read" | "import" | "write" | "fork" | "exec" | "exit" | "error"];
}

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
        
        function initialize(e) {
            let func = new AsyncFunction('system', e.data);
            func.bind(this)(system)
                .then(() => {
                    return system.exit("");
                }).catch((error) => {
                system.error(error.toString());
                console.log(error);
            });
            messageHandler = handleCallReturn;
        }
        
        function handleCallReturn(e) {
            let id = e.data[0];
            let data = e.data[1];
            let sysCall = calls[id];
            if (sysCall){
                delete calls[id];
                sysCall(data);
            }
        }
        
        let messageHandler = initialize;
    
    
        return messageHandler;
    }();
`;

let fileDescriptorCounter = 0;

export class Process extends ProcessFile {
    private readonly parentProcess : Process | null;
    private readonly workingDirectory : Directory;
    private readonly executablePath : string[];
    private readonly executableName : string;
    private readonly fileDescriptors : {[number : number]: File} = {};
    private readonly stdin : File;
    private readonly stdout : File;
    private readonly stderr : File;
    private readonly worker : Worker;

    constructor(parentProcess : Process | null, workingDirectory : Directory, executablePathArray : string[], stdout : File, stderr : File){
        super();

        this.parentProcess = parentProcess;
        this.workingDirectory = workingDirectory;
        this.executablePath = executablePathArray;
        this.executableName = executablePathArray[executablePathArray.length-1];

        this.stdin = this;
        this.stdout = stdout;
        this.stderr = stderr;

        this.worker = new Worker('data:application/javascript,' + encodeURIComponent(script));

        this.worker.onmessage = (event : WorkerEvent) => {
            // sys call. Should be an array.
            let id = event.data[0];
            let name = event.data[1];
            let args = event.data.slice(2);
            console.log("WORKER CALL", name);
            let func = this.systemCalls[name];
            if (func){
                func(...args)
                    .then((returnValue : ArrayBuffer) => {
                        this.worker.postMessage([id, returnValue]);
                    })
                    .catch((error : string) => {
                        let buffer = stringToArrayBuffer(`System error: ${error}`);
                        this.onExit();
                        return this.stderr.write(buffer);
                    });
            } else {
                console.log(`Invalid operation ${name}`);
            }
        };

        this.workingDirectory.getFile(this.executablePath)
            .then((executableFile) => {
                return executableFile.read();
            })
            .then((arrayBuffer) => {
                return parseTextArrayBuffer(arrayBuffer)
            })
            .then((script) => {
                return this.worker.postMessage(script);
            })
            .catch((error) => {
                let buffer = stringToArrayBuffer(`File ${this.executableName} could not be executed: ${error}`);
                this.onExit();
                return this.stderr.write(buffer);
            });
    }

    get name(){
        return this.executableName;
    }

    fork(){
        return new Process(this, this.workingDirectory, [this.executableName], this.stdout, this.stderr);
    }

    get systemCalls() : syscallTable {
        let getFile = (fileDescriptor : number) => {
            let file = this.fileDescriptors[fileDescriptor];
            if (file === undefined){
                throw new Error("File is not open.");
            }
            return file;
        };

        return {
            import: async (pathArray, variableName) => {
                // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
                // Right now executes script as function with FileSystem bound as "this". In an ideal world
                // with dynamic imports would import as a module and could use relative paths.
                let file = await this.workingDirectory.getFile(pathArray);
                let fileData = await file.read();
                let scriptString =  parseTextArrayBuffer(fileData);
                try {
                    let func = new AsyncFunction(`${scriptString};return ${variableName};`);
                    return await func.bind(this)();
                } catch (e) {
                    throw new Error(`Error importing file at ${pathArray.join('/')}: ${e}`);
                }
            },
            open: async (path : string[]) => {
                let file = await this.workingDirectory.getFile(path);
                fileDescriptorCounter ++;
                this.fileDescriptors[fileDescriptorCounter] = file;
                return fileDescriptorCounter;
            },
            close: async (fileDescriptor : number) => {
                delete this.fileDescriptors[fileDescriptor];
            },
            read: async (fileDescriptor : number) => {
                let file = getFile(fileDescriptor);
                return await file.read();
            },
            write: async (fileDescriptor, data) => {
                let file = getFile(fileDescriptor);
                return await file.write(data);
            },
            fork: async () => {
                let process = new Process(this, this.workingDirectory, [this.executableName], this.stdout, this.stderr);
                return Number.parseInt(process.id);
            },
            exec: async (pathArray : string[], ...args : string[]) => {
                let process = new Process(this, this.workingDirectory, pathArray, this.stdout, this.stderr);
                return Number.parseInt(process.id);
            },
            exit: async (message) => {
                let buffer = stringToArrayBuffer(message);
                await this.stdout.write(buffer);
                this.onExit();
            },
            error: async (message) => {
                let buffer = stringToArrayBuffer(`The process ${this.name} returned an error: ${message}`);
                await this.stderr.write(buffer);
                this.onExit();
            },
        }
    }

    /**
     * Execute the "main" function of the javascript file. The variable "this" will be this fileSystem.
     * @async
     * @param {string[]} pathArray - The path of a file containing javascript to be executed.
     * @param {string[]} args - The arguments to be provided to the "main" function in the file.
     */
    async execPath(pathArray : string[], ...args : string[]) {
        let process = new Process(this, this.workingDirectory, pathArray, this.stdout, this.stderr);
        return process.id;
    }

    onExit(){
        this.worker.terminate();
        this.delete();
    }
}