

/**
 * Extends a file system with StateMixin so that it can cache fileObjects that
 * have already been retrieved by their path.
 * @mixin CacheMixin
 * @param {AbstractDirectory} DirectoryClass - A subclass of BaseFileSystem.
 * @returns {AbstractDirectory}
 */
export let CacheMixin = (DirectoryClass) => {
    return class extends DirectoryClass {
        constructor(...args) {
            super(...args);
            this._pathCache = {};
        }

        async stat(path){
            let strPath = JSON.stringify(path);
            let fileObject = this._pathCache[strPath];
            if (!fileObject){
                fileObject = await super.stat(path);
                this._pathCache[strPath] = fileObject;
            }
            return fileObject;
        }

        async refresh(){
            this._pathCache = {};
            await super.refresh();
        }
    };
};
