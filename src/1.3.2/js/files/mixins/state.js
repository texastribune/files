import {CacheMixin} from "../virtual.js";


/**
 * A mixin that preserves current path of the file system via the url fragment.
 * @mixin StateMixin
 * @param {AbstractDirectory} DirectoryClass - A subclass of AbstractDirectory.
 * @returns {AbstractDirectory}
 */
export let StateMixin = (DirectoryClass) => {
    DirectoryClass = CacheMixin(DirectoryClass);
    return class extends DirectoryClass {
        constructor(...args) {
            super(...args);
            this._currentDirectory = null;
            this._data = [];
            this._path = [];
            this._lastCall = null;
            this._compressor = LZString;
            this._trackState = false;

            // callbacks
            this.onDataChanged = null;
            this.onPathChanged = null;

            // wrap methods
            this.addFile = this.waitOn(this.refreshAfter(this.addFile));
            this.addDirectory = this.waitOn(this.refreshAfter(this.addDirectory));
            this.copy =this.waitOn(this.refreshAfter(this.copy));
            this.move = this.waitOn(this.refreshAfter(this.move));
            this.search = this.waitOn(this.search);
            this.changeDirectory = this.waitFor(this.waitOn(this.changeDirectory));
            // this.refresh = this.waitFor(this.waitOn(this.refresh));

            window.addEventListener('hashchange', this.waitOn((event) => {
                if (this._trackState){
                    this._hashState = location.hash;
                }
            }));

            this.changeDirectory(this.currentPath);
        }

        // getters

        /**
         * An object mapping file names to FileNode objects for the current directory.
         * @memberof StateMixin#
         */
        get data(){
            return this._data;
        }

        /**
         * An array of strings representing the path of the current directory.
         * @memberof StateMixin#
         */
        get currentPath(){
            return this._path;
        }

        get _hashState(){
            return this._compressor.compressToEncodedURIComponent(JSON.stringify(this.currentPath));
        }

        set _hashState(value) {
            if (value.startsWith('#')) {
                value = value.slice(1, value.length);
            }
            if (value !== this._hashState){
                let pathArray;
                try {
                    pathArray = JSON.parse(this._compressor.decompressFromEncodedURIComponent(value));
                } catch (SyntaxError) {
                    console.log(`Invalid hash state ${value}`);
                }
                if (pathArray){
                    this.changeDirectory(pathArray);
                }
            }
        }

        set trackState(value){
            this._trackState = Boolean(value);
            if (this._trackState){
                this._hashState = location.hash;
            }
        }

        clone(){
            let clone = super.clone();
            clone._path = this._path;
            clone._currentDirectory = this._currentDirectory;
            clone._data = this._data.slice(0);
            clone.trackState = false;
            return clone;
        }

        /**
         * Change the current directory.
         * @memberof StateMixin#
         * @param {string[]} pathArray - An array of strings representing the path of directory to navigate to.
         * or relative to the current directory.
         */
        async changeDirectory(pathArray){
            this._path = pathArray.slice(0);
            this._currentDirectory = await this.getFile(pathArray);
            await this.refresh();
            if (this.onPathChanged){
                this.onPathChanged(this.currentPath);
            }

            if (this._trackState){
                window.location.hash = this._hashState;
            }
        }

        /**
         * Refresh the data for the current directory and clear any cached FileObjects.
         * @memberof StateMixin#
         * @async
         */
        async refresh(){
            this._currentDirectory = await this.getFile(this.currentPath);
            this._data = await this._currentDirectory.getChildren();
            if (this.onDataChanged){
                this.onDataChanged(this.data);
            }
        }

        /**
         * Utility wrapper for async functions.
         * Calls refresh after the the function returns.
         * @memberof StateMixin#
         */
        refreshAfter(func) {
            return async (...args) => {
                let ret = await func.bind(this)(...args);
                await this.refresh();
                return ret;
            };
        }

        /**
         * Utility wrapper for async functions.
         * Functions wrapped by "waitOn" function will not execute until this function returns. Use this
         * to wrap functions that change state.
         * @memberof StateMixin#
         */
        waitFor(func){
            // Wrapper for functions that returns a promise
            // Calls of functions wrapped by "waitOn" function will
            // will not execute until this function's promise is resolved
            return async (...args) => {
                this._lastCall = func.bind(this)(...args);
                return await this._lastCall;
            };
        }

        /**
         * Utility wrapper for async functions.
         * Delays execution of the wrapped function until any previously called functions
         * wrapped by "waitFor" return. This allows these functions to wait to execute until state is updated
         * preventing race conditions.
         * @memberof StateMixin#
         */
        waitOn(func){
            // Wrapper for a function. Function is called after the promise
            // returned by the last called "waitFor" wrapped function resolves.
            return async (...args) => {
                if (this._lastCall === null){
                    this._lastCall = Promise.resolve();
                }

                try {
                    await this._lastCall;
                } catch (error){
                    this._lastCall = null;
                }
                return await func.bind(this)(...args);
            };
        }
    }
};