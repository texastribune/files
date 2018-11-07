import {ProcessFile} from "./files.js";

let idCounter = 0;

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


export class Process extends ProcessFile {
    constructor(parentProcess, workingDirectory, name, script, stdout, stderr){
        super();

        idCounter ++;
        this._id = idCounter;

        this._parentProcess = parentProcess;
        this._workingDirectory = workingDirectory;
        this._name = name;

        this._stdout = stdout;
        this._stderr = stderr;

        this._script = script;
        this.runScript(this._script)
            .then((returnValue) => {

            })
            .catch((error) => {
                return `The process ${this.name} returned an error: ${error}`
            })
    }

    get id(){
        return this._id;
    }

    get name(){
        return this._name;
    }

    fork(){
        return new Process(this, this._workingDirectory, this._name, this._script, this._stdout, this._stderr);
    }

    /**
     * An array of absolute path arrays to directories that the exec command with search in
     * when the exec method is called.
     */
    get executablePath() {
        return this._fileSystem.executablePath;
    }

    /**
     * Execute the "main" function of the javascript file with the name given in the command parameter
     * with the given arguments. The variable "this" will be this fileSystem. The file must be located in the executable path, which is an array
     * of absolute path arrays.
     * @async
     * @param {string} command - The name of a javascript file located in the .bin directory.
     * @param {string[]} args - The arguments to be provided to the "main" function in the file.
     */
    async exec(command, ...args) {
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
        let file = await this._fileSystem.getFile(pathArray);
        let scriptString = await file.readText();
        return await this.runScript(scriptString);
    }

    /**
     * Execute the "main" function of the javascript file with the name given in the command parameter
     * with the given arguments. The file must be located in the executable path, which is an array
     * of absolute path arrays. The variable "this" will be this fileSystem.
     * @async
     * @param {string[]} pathArray - An array of strings representing the path of the file to copy to.
     * @param {string} variableName - The name of the variable to import from the javascript file.
     * @return {*} The value of the variable.
     */
    async import(pathArray, variableName) {
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
    }

    exit(returnValue){

    }

    async runScript(scriptString){
        let func = new AsyncFunction('exit', 'stdout', 'stderr', scriptString);
        await func.bind(this)(this.exit, this._stdout, this._stderr);
    }
}