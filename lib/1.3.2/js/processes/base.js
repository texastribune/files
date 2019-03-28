"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const files_1 = require("./files");
const utils_1 = require("../utils");
const AsyncFunction = Object.getPrototypeOf(function () {
    return __awaiter(this, void 0, void 0, function* () { });
}).constructor;
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
class Process extends files_1.ProcessFile {
    constructor(parentProcess, workingDirectory, executablePathArray, stdout, stderr) {
        super();
        this.fileDescriptors = {};
        this.parentProcess = parentProcess;
        this.workingDirectory = workingDirectory;
        this.executablePath = executablePathArray;
        this.executableName = executablePathArray[executablePathArray.length - 1];
        this.stdin = this;
        this.stdout = stdout;
        this.stderr = stderr;
        this.worker = new Worker('data:application/javascript,' + encodeURIComponent(script));
        this.worker.onmessage = (event) => {
            // sys call. Should be an array.
            let id = event.data[0];
            let name = event.data[1];
            let args = event.data.slice(2);
            console.log("WORKER CALL", name);
            let func = this.systemCalls[name];
            if (func) {
                func(...args)
                    .then((returnValue) => {
                    this.worker.postMessage([id, returnValue]);
                })
                    .catch((error) => {
                    let buffer = utils_1.stringToArrayBuffer(`System error: ${error}`);
                    this.onExit();
                    return this.stderr.write(buffer);
                });
            }
            else {
                console.log(`Invalid operation ${name}`);
            }
        };
        this.workingDirectory.getFile(this.executablePath)
            .then((executableFile) => {
            return executableFile.read();
        })
            .then((arrayBuffer) => {
            return utils_1.parseTextArrayBuffer(arrayBuffer);
        })
            .then((script) => {
            return this.worker.postMessage(script);
        })
            .catch((error) => {
            let buffer = utils_1.stringToArrayBuffer(`File ${this.executableName} could not be executed: ${error}`);
            this.onExit();
            return this.stderr.write(buffer);
        });
    }
    get name() {
        return this.executableName;
    }
    fork() {
        return new Process(this, this.workingDirectory, [this.executableName], this.stdout, this.stderr);
    }
    get systemCalls() {
        let getFile = (fileDescriptor) => {
            let file = this.fileDescriptors[fileDescriptor];
            if (file === undefined) {
                throw new Error("File is not open.");
            }
            return file;
        };
        return {
            import: (pathArray, variableName) => __awaiter(this, void 0, void 0, function* () {
                // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
                // Right now executes script as function with FileSystem bound as "this". In an ideal world
                // with dynamic imports would import as a module and could use relative paths.
                let file = yield this.workingDirectory.getFile(pathArray);
                let fileData = yield file.read();
                let scriptString = utils_1.parseTextArrayBuffer(fileData);
                try {
                    let func = new AsyncFunction(`${scriptString};return ${variableName};`);
                    return yield func.bind(this)();
                }
                catch (e) {
                    throw new Error(`Error importing file at ${pathArray.join('/')}: ${e}`);
                }
            }),
            open: (path) => __awaiter(this, void 0, void 0, function* () {
                let file = yield this.workingDirectory.getFile(path);
                fileDescriptorCounter++;
                this.fileDescriptors[fileDescriptorCounter] = file;
                return fileDescriptorCounter;
            }),
            close: (fileDescriptor) => __awaiter(this, void 0, void 0, function* () {
                delete this.fileDescriptors[fileDescriptor];
            }),
            read: (fileDescriptor) => __awaiter(this, void 0, void 0, function* () {
                let file = getFile(fileDescriptor);
                return yield file.read();
            }),
            write: (fileDescriptor, data) => __awaiter(this, void 0, void 0, function* () {
                let file = getFile(fileDescriptor);
                return yield file.write(data);
            }),
            fork: () => __awaiter(this, void 0, void 0, function* () {
                let process = new Process(this, this.workingDirectory, [this.executableName], this.stdout, this.stderr);
                return Number.parseInt(process.id);
            }),
            exec: (pathArray, ...args) => __awaiter(this, void 0, void 0, function* () {
                let process = new Process(this, this.workingDirectory, pathArray, this.stdout, this.stderr);
                return Number.parseInt(process.id);
            }),
            exit: (message) => __awaiter(this, void 0, void 0, function* () {
                let buffer = utils_1.stringToArrayBuffer(message);
                yield this.stdout.write(buffer);
                this.onExit();
            }),
            error: (message) => __awaiter(this, void 0, void 0, function* () {
                let buffer = utils_1.stringToArrayBuffer(`The process ${this.name} returned an error: ${message}`);
                yield this.stderr.write(buffer);
                this.onExit();
            }),
        };
    }
    /**
     * Execute the "main" function of the javascript file. The variable "this" will be this fileSystem.
     * @async
     * @param {string[]} pathArray - The path of a file containing javascript to be executed.
     * @param {string[]} args - The arguments to be provided to the "main" function in the file.
     */
    execPath(pathArray, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            let process = new Process(this, this.workingDirectory, pathArray, this.stdout, this.stderr);
            return process.id;
        });
    }
    onExit() {
        this.worker.terminate();
        this.delete();
    }
}
exports.Process = Process;
