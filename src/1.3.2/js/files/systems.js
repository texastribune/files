import LZString from "../lz-string-1.4.4/lz-string.min.js";
import {FileObject} from "./objects.js";
import {FileNotFoundError} from "./storages/base.js";
import {parseJsonArrayBuffer} from "../utils";


/**
 *   File system classes provide a hierarchical tree structure of files contained in AbstractFileStorage
 *   implementation via path related operations.
 *   @extends FileObject
 */
export class BaseFileSystem {
  constructor(rootFileStorage){
      let rootNode = rootFileStorage.getRootFileNode();
      this._storage = rootFileStorage;
  }

  // getters

  get storage(){
    return this._storage;
  }

  /**
   * Get the file object at the given path.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the file to read.
   * @returns {FileObject} - The file object located at the given path.
   * @throws FileNotFoundError
   */
  async stat(pathArray) {
    if (!(pathArray instanceof Array)){
      throw Error(`Path must be an array, not ${typeof pathArray}`);
    }
    if (pathArray.length === 0){
      return this;
    }

    let name = pathArray[pathArray.length-1];
    let parentPath = pathArray.slice(0, pathArray.length - 1);
    let fileNodeArray = await this.listDirectory(parentPath);
    let matchingNode;
    while (matchingNode === undefined && fileNodeArray.length > 0){
      let fileNode = fileNodeArray.pop();
      if (fileNode.name === name){
        matchingNode = fileNode;
      }
    }
    if (matchingNode === undefined) {
      throw new FileNotFoundError(`File ${name} not found.`);
    }
    return matchingNode;
  }

  /**
   * Return a javascript Object mapping file names to file objects for each file in the
   * directory represented by the given fileObject.
   * @async
   * @param {FileNode} fileNode - FileNodes referring to the directory to list.
   * @returns {FileNode[]} - An Array of the child FileNodes in the given directory.
   */
  async getDirectoryChildren(fileNode) {
    let directoryData = await this.fileStorage.readFileNode(fileNode);
    return parseJsonArrayBuffer(directoryData);
  }

  /**
   * Return a javascript Object mapping file names to file objects for each file in the
   * directory represented by the given path.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the file to read.
   * @returns {FileNode[]} - Array of FileObjects for each file in the given directory.
   */
  async listDirectory(pathArray) {
    let directory = await this.stat(pathArray);
    return await this.getDirectoryChildren(directory);
  }

  /**
   * Add a file to the current directory.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the directory to add the file to.
   * @param {ArrayBuffer} fileData - The file or a dataUrl of a file to be added to the current directory.
   * @param {string} [filename] - A name for the new file.
   * @param {string} [mimeType=application/octet-stream] - A mimeType for the file.
   * @returns {FileNode} - The data for the newly created directory
   */
  async addFile(pathArray, fileData, filename, mimeType) {
    let parentFileNode = await this.stat(pathArray);
    return await this.fileStorage.addFile(parentFileNode.id, fileData, filename, mimeType);
  }

  /**
   * Add a directory to the current directory.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the directory to add the directory to.
   * @param {string} name - A name for the new directory.
   * @returns {FileObject} - The data for the newly created directory
   */
  async addDirectory(pathArray, name) {
    let parentFileNode = await this.stat(pathArray);
    return await this.fileStorage.addDirectory(parentFileNode.id, name);
  }

  /**
   * Read the file.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the file to read.
   * @param {Object} [params={}] - Read parameters.
   * @returns {ArrayBuffer} - An ArrayBuffer containing the file data.
   */
  async read(pathArray, params) {
      let fileNode = await this.stat(pathArray);
      return await this.fileStorage.readFileNode(fileNode.id, params);
  }

  /**
   * Copy a file into the current directory.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the file to copy to.
   * @param {FileNode} fileNode - The file object representing the file to be copied.
   */
  async copy(sourcePathArray, targetPathArray){
    let sourceFileNode = await this.stat(sourcePathArray);
    let tarstat = await this.stat(targetPathArray);
    await this.fileStorage.copy(sourceFileNode.id, tarstat.id);
  }

  /**
   * Move a file into the current directory.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the destination to move to.
   * @param {FileObject} fileObject - The file object representing the directory to move the file to.
   */
  async move(sourcePathArray, targetPathArray){
    let sourceFileNode = await this.stat(sourcePathArray);
    let tarstat = await this.stat(targetPathArray);
    await this.fileStorage.move(sourceFileNode.id, tarstat.id);
  }


  /**
   * Change the name of the file.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the file to rename.
   * @param {string} newName - The new name for the file.
   */
  async rename(pathArray, newName) {
      let fileNode = await this.stat(pathArray);
      await this.fileStorage.rename(fileNode.id, newName);
  }

  /**
   * Delete the file from its storage location.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the file to delete.
   */
  async delete(pathArray) {
      let fileNode = await this.stat(pathArray);
      return await this.fileStorage.delete(fileNode.id);
  }

  /**
   * Search the file and all of its children recursively based on the query.
   * @async
   * @param {string[]} pathArray - An array of strings representing the path of the file to search.
   * @param {string} query - Words to be searched seperated by spaces.
   * @returns {FileObject[]} - A list of file objects.
   */
  async search(pathArray, query) {
    let fileNode = await this.stat(pathArray);
    return await this.fileStorage.search(fileNode.id, query);
  }

  /**
   * Create a duplicate instance of this file system.
   * @returns {AbstractFileStorage} - A new instance with the same state.
   */
  clone(){
    return new this.constructor(this._rootFileStorage);
  };
}


/**
 * Extends a file system with StateMixin so that it can cache fileObjects that
 * have already been retrieved by their path.
 * @mixin CacheMixin
 * @param {VirtualFileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {VirtualFileSystem}
 */
export let CacheMixin = (FileSystemClass) => {
  return class extends FileSystemClass {
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


/**
 * A mixin that preserves current path of the file system via the url fragment.
 * @mixin StateMixin
 * @param {VirtualFileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {VirtualFileSystem}
 */
export let StateMixin = (fileSystemClass) => {
  fileSystemClass = CacheMixin(fileSystemClass);
  return class extends fileSystemClass {
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

      this.changeDirectory(this.path);
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
    get path(){
      return this._path;
    }

    get _hashState(){
      return this._compressor.compressToEncodedURIComponent(JSON.stringify(this.path));
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
      this._currentDirectory = await this.getFileObject(pathArray);
      await this.refresh();
      if (this.onPathChanged){
        this.onPathChanged(this.path);
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
      if (this._currentDirectory !== null){
        this._currentDirectory.clearCache();
      }
      this._data = await this.listDirectory(this.path);
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

/**
 * Extends a file system so that each directory contains two links. One named "." that is a link to the
 * directory itself and another named ".." that references the directories parent if it exists.
 * @mixin HiddenReferenceLinkMixin
 * @param {VirtualFileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {VirtualFileSystem}
 */
export let HiddenReferenceLinkMixin = (fileSystemClass) => {
  return class extends fileSystemClass {
    constructor(...args) {
      super(...args);
    }

    static get linkMimeType(){
      return 'inode/symlink';
    }

    async _getDirectoryLinks(path){
      let links = [];

      let tempStorage = new MemoryFileStorage();
      let tempStorageRoot = await tempStorage.getRootFileNode();

      let pathData = stringToArrayBuffer(JSON.stringify(path));
      let fileNode = await this.stat(path);
      fileNode.name = '.';
      fileNode.mimeType = this.constructor.linkMimeType;
      links.push(fileNode);

      if (directoryFileNode.parent){
        let parentPathData =stringToArrayBuffer(JSON.stringify(directoryFileNode.parent.path));
        let parentFileNode = await tempStorage.addFile(tempStorageRoot.id, parentPathData, '..', this.constructor.linkMimeType);
        links.push(new FileObject(parentFileNode, directoryFileNode, tempStorage));
      }
      return links;
    }

    async stat(pathArray){
      let fileNode = await super.stat(pathArray);
      if (fileNode.mimeType === this.constructor.linkMimeType){
        let fileData = this.fileStorage.read(fileNode.id);
        let targetPath = await parseJsonArrayBuffer(fileData);
        fileNode = await this.stat(targetPath);
      }
      return fileNode;
    }

    async getDirectoryChildren(fileNode){
      let fileNodeArray = await super.getDirectoryChildren(fileNode);
      let links = await this._getDirectoryLinks(fileNode);
      fileNodeArray = fileNodeArray.concat(links);
      return fileNodeArray;
    }
  };
};

class VirtualFileSystem extends BaseFileSystem {
  constructor(){
    super(null);
    this._mounts = [];
  }

  async mount(pathArray, fileSystem){
    let fileNode = await this.stat(path);
    this._mounts.push({
        fileNodeId: fileNode.id,
        fileSystem: fileSystem
    })
  }

  async listDirectory(path){
    let fileNode = await this.stat(path);
    let fileObjectsArray = await super.getDirectoryChildren(fileNode);
    for (let mount of this._mounts){
      if (mount.parentSystem === fileObject.root &&
          mount.fileObjectId === fileObject.fileNode.id){
        fileObjectsArray.push(mount.fileSystem);
      }
    }
    return fileObjectsArray;
  }
}

/**
 * Extends a file system so that it can mount file storages other than the root file storage
 * at arbitrary paths in the file system.
 * @mixin MountStorageMixin
 * @param {VirtualFileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {VirtualFileSystem}
 */
export let MountStorageMixin = (fileSystemClass) => {
  return class extends fileSystemClass {
    constructor(...args) {
      super(...args);
      this._mounts = [];
    }

    async mount(pathArray, fileSystem){
      if (!name){
        throw new Error("Mount must have a name.");
      }
      let fileObject = await this.getFileObject(pathArray);
      this._mounts.push({
          parentSystem: fileObject.root,
          fileObjectId: fileObject.fileNode.id,
          fileSystem: fileSystem
      })
    }

    async getDirectoryChildren(fileObject){
      let fileObjectsArray = await super.getDirectoryChildren(fileObject);
      for (let mount of this._mounts){
        if (mount.parentSystem === fileObject.root &&
            mount.fileObjectId === fileObject.fileNode.id){
          let mountedRootFileNode = await mount.fileStorage.getRootFileNode();
          mountedRootFileNode.name = mount.name;
          fileObjectsArray.push(mount.fileSystem);
        }
      }
      return fileObjectsArray;
    }

    clone(){
      let clone = super.clone();
      for (let mount of this._mounts){
        clone.mount(mount.fileObject, mount.fileStorage, mount.name);  //TODO Should be async
      }
      return clone;
    }
  };
};


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


/**
 * Extends a file system so that it can mount file storages other than the root file storage
 * at arbitrary paths in the file system.
 * @mixin ExecutableMixin
 * @param {VirtualFileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {VirtualFileSystem} The mixin class.
 */
export let ExecutableMixin = (FileSystemClass) => {
    return class extends FileSystemClass {
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
            let fileObject = await this.getFileObject(pathArray);
            let scriptString = await fileObject.readText(pathArray);
            try {
                let func = new AsyncFunction(`${scriptString};return ${variableName};`);
                return await func.bind(this)();
            } catch (e) {
                throw new Error(`Error importing file at ${pathArray.join('/')}: ${e}`);
            }
        }
    };
};



/**
 * A full implementation of the file system.
 * @extends BaseFileSystem
 * @mixes ExecutableMixin
 * @mixes HiddenReferenceLinkMixin
 * @mixes MountStorageMixin
 * @mixes StateMixin
 */
export class FileSystem extends ExecutableMixin(HiddenReferenceLinkMixin(
                                MountStorageMixin(StateMixin(VirtualFileSystem)))){
}
