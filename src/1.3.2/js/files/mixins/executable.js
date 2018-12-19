

/**
 * Extends a file system so that it can mount file storages other than the root file storage
 * at arbitrary paths in the file system.
 * @mixin ExecutableMixin
 * @param {Directory} DirectoryClass - A subclass of AbstractDirectory.
 * @returns {Directory} The mixin class.
 */
export let ExecutableMixin = (DirectoryClass) => {
    return class extends DirectoryClass {
        constructor(...args) {
            super(...args);

            if (this.waitOn) {
                this.import = this.waitOn(this.import);
            }

            this._executablePath = [
                ['bin']
            ];
        }

        /**
         * An array of absolute path arrays to directories that the exec command with search in
         * when the exec method is called.
         * @memberof ExecutableMixin#
         */
        get executablePath() {
            return this._executablePath;
        }

        set executablePath(value) {
            this._executablePath = value;
        }

        /**
         * Execute the "main" function of the javascript file with the name given in the command parameter
         * with the given arguments. The variable "this" will be this fileSystem. The file must be located in the executable path, which is an array
         * of absolute path arrays.
         * @memberof ExecutableMixin#
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
                    main = await this.import(pathArray.concat([jsName]), 'main');
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
         * @memberof ExecutableMixin#
         * @async
         * @param {string[]} pathArray - The path of a file containing javascript to be executed.
         * @param {string[]} args - The arguments to be provided to the "main" function in the file.
         */
        async execPath(pathArray, ...args) {
            let main = await this.import(path, 'main');
            return await main.bind(this)(...args);
        }

        /**
         * Execute the "main" function of the javascript file with the name given in the command parameter
         * with the given arguments. The file must be located in the executable path, which is an array
         * of absolute path arrays. The variable "this" will be this fileSystem.
         * @memberof ExecutableMixin#
         * @async
         * @param {string[]} pathArray - An array of strings representing the path of the file to copy to.
         * @param {string} variableName - The name of the variable to import from the javascript file.
         * @return {*} The value of the variable.
         */
        async import(pathArray, variableName) {
            // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
            // Right now executes script as function with FileSystem bound as "this". In an ideal world
            // with dynamic imports would import as a module and could use relative paths.
            let file = await this.getFile(pathArray);
            let scriptString = await file.readText();
            try {
                let func = new AsyncFunction(`${scriptString};return ${variableName};`);
                return await func.bind(this)();
            } catch (e) {
                throw new Error(`Error importing file at ${pathArray.join('/')}: ${e}`);
            }
        }
    };
};