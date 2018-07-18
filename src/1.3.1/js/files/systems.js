import LZString from "../lz-string-1.4.4/lz-string.min.js";
import {FileObject, Link} from "./objects.js";
import {FileNotFoundError} from "./storages/base.js";


export class BaseFileSystem {
  /**
   *   File system classes provide a hierarchical tree structure of files contained in AbstractFileStorage
   *   implementation.
   */
  constructor(rootFileStorage){
    this._rootFileStorage = rootFileStorage;

    let rootFileNode = this._rootFileStorage.rootFileNode;
    this._rootFileObject = new FileObject(this._rootFileStorage, rootFileNode,
                                          this.constructor.rootFileName, null);
  }

  // getters

  get rootFileObject(){
    return this._rootFileObject;
  }

  static get rootFileName(){
    return 'root';
  }

  /**
   * Get the file object at the given path.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the file to read.
   * @returns {FileObject} - The file object located at the given path.
   */
  async getFileObject(pathArray) {
    if (pathArray.length === 0){
      return this.rootFileObject;
    }

    let name = pathArray[pathArray.length-1];
    let parentPath = pathArray.slice(0, pathArray.length - 1);
    let fileObjectsMap = await this.listDirectory(parentPath);
    let fileObject = fileObjectsMap[name];
    if (!fileObject) {
      throw new FileNotFoundError(`File ${name} not found.`);
    }
    return fileObject;
  }

  /**
   * Return a javascript Object mapping file names to file objects for each file in the
   * directory represented by the given fileObject.
   * @async
   * @abstract
   * @param {FileObject} fileObject - FileObject referring to the directory to list.
   * @returns {Object} - Object mapping filename to FileObject for each file in the given directory.
   */
  async getChildren(fileObject) {
    let fileNodesMap = await fileObject.readJSON();
    let fileObjectsMap = {};
    for (let filename in fileNodesMap){
      fileObjectsMap[filename] = new FileObject(fileObject.fileStorage, fileNodesMap[filename], filename, fileObject);
    }
    return fileObjectsMap;
  }

  /**
   * Return a javascript Object mapping file names to file objects for each file in the
   * directory represented by the given path.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the file to read.
   * @returns {Object} - Object mapping filename to FileObject for each file in the given directory.
   */
  async listDirectory(pathArray) {
    let fileObject = await this.getFileObject(pathArray);
    return await this.getChildren(fileObject);
  }

  /**
   * Read the file at the given path.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the file to read.
   * @param {Object} params - Query params to read with.
   * @returns {File} - https://developer.mozilla.org/en-US/docs/Web/API/File
   */
  async read(pathArray, params) {
    let fileObject = await this.getFileObject(pathArray);
    return await fileObject.read(params);
  }

  /**
   *
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the file to write.
   * @param {string|Object|Blob|FormData} data - data to be written to the file located at the given path.
   */
  async write(pathArray, data){
    let fileObject = await this.getFileObject(pathArray);
    return await fileObject.write(data);
  }

  /**
   * Add a file to the current directory.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the directory to add the file to.
   * @param {File|string} file - The file or a dataUrl of a file to be added to the current directory.
   * @param {string} [filename] - A name for the new file.
   * @returns {FileObject} - The data for the newly created directory
   */
  async addFile(pathArray, file, filename) {
    let parentFileObject = await this.getFileObject(pathArray);
    let newFile = await  parentFileObject.fileStorage.addFile(parentFileObject.fileNode, file, filename);
    return new FileObject( parentFileObject.fileStorage, newFile,
                          filename,  parentFileObject);
  }

  /**
   * Add a directory to the current directory.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the directory to add the directory to.
   * @param {string} name - A name for the new directory.
   * @returns {FileNode} - The data for the newly created directory
   */
  async addDirectory(pathArray, name) {
    let parentFileObject = await this.getFileObject(pathArray);
    let newDir = await parentFileObject.fileStorage.addDirectory(parentFileObject.fileNode, name);
    return new FileObject(parentFileObject.fileStorage, newDir,
                          name, parentFileObject);
  }

  /**
   * Copy a file into the current directory.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the file to copy to.
   * @param {FileObject} fileObject - The file object representing the file to be copied.
   */
  async copy(pathArray, fileObject){
    let targetFileObject = await this.getFileObject(pathArray);
    if (fileObject.fileStorage === targetFileObject.fileStorage){
      await fileObject.fileStorage.copy(fileObject.fileNode, targetFileObject.fileNode);
    } else {
      let file = await this.targetFileObject.fileStorage.readFileNode(this.targetFileObject.fileNode);
      await this.targetFileObject.fileStorage.addFile(this.targetFileObject.fileNode, file, fileObject.name);
    }
  }

  /**
   * Move a file into the current directory.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the destination to move to.
   * @param {FileObject} fileObject - The file object representing the directory to move the file to.
   */
  async move(pathArray, fileObject){
    let targetFileObject = await this.getFileObject(pathArray);
    if (fileObject.fileStorage === targetFileObject.fileStorage){
      await fileObject.fileStorage.move(fileObject.fileNode, targetFileObject.fileNode);
    } else {
      throw new Error("Cannot move file across file systems.");
    }
  }

  /**
   * Search the location and its subdirectories recursively for files matching the given search term.
   * @async
   * @abstract
   * @param {string[]} pathArray - An array of strings representing the path of the directory to be searched.
   * @param {string} query - Search terms.
   * @returns {FileObject[]} - A list of FileObjects that match the query.
   */
  async search(pathArray, query){
    let searchFileObject = await this.getFileObject(pathArray);
    return await searchFileObject.search(query);
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
 * @mixinFunction
 *  @param {FileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {BaseFileSystem}
 */
let CacheMixin = (FileSystemClass) => {
  return class extends FileSystemClass {
    constructor(...args) {
      super(...args);
      this._pathCache = {};
    }

    async getFileObject(path){
      let strPath = JSON.stringify(path);
      let fileObject = this._pathCache[strPath];
      if (!fileObject){
        fileObject = await super.getFileObject(path);
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
 * @mixinFunction
 * @param {FileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {BaseFileSystem}
 */
export let StateMixin = (fileSystemClass) => {
  fileSystemClass = CacheMixin(fileSystemClass);
  return class extends fileSystemClass {
    constructor(...args) {
      super(...args);
      this._currentDirectory = null;
      this._data = {};
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
     */
    get data(){
      return this._data;
    }

    /**
     * An array of strings representing the path of the current directory.
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
      clone._data = Object.assign({}, this._data);
      clone.trackState = false;
      return clone;
    }

    /**
     * Change the current directory.
     * @param {string[]} pathArray - An array of strings representing the path of directory to navigate to.
     * or relative to the current directory.
     */
    async changeDirectory(pathArray){
      this._path = pathArray.slice();
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
     * @async
     * @abstract
     */
    async refresh(){
      this._rootFileObject.clearCache();
      this._currentDirectory.clearCache();
      this._data = await this.listDirectory(this.path);
      if (this.onDataChanged){
        this.onDataChanged(this.data);
      }
    }

    /**
     * Utility wrapper for async functions.
     * Calls refresh after the the function returns.
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
 * @mixinFunction
 * @param {FileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {BaseFileSystem}
 */
export let HiddenReferenceLinkMixin = (fileSystemClass) => {
  return class extends fileSystemClass {
    constructor(...args) {
      super(...args);
    }

    async changeDirectory(pathArray){
      let fileObject = await this.getFileObject(pathArray);
      if (fileObject.mimeType === 'inode/symlink'){
        pathArray = await fileObject.readJSON();
      }
      await super.changeDirectory(pathArray);
    }

    async getChildren(fileObject){
      let fileObjectsMap = await super.getChildren(fileObject);
      fileObjectsMap['.'] = new Link(fileObject, '.', fileObject);
      if (fileObject.parent){
        fileObjectsMap['..'] = new Link(fileObject.parent, '..', fileObject);
      }
      return fileObjectsMap;
    }

    async listDirectory(pathArray) {
      let fileObject = await this.getFileObject(pathArray);
      if (fileObject.mimeType === 'inode/symlink'){
        pathArray = await fileObject.readJSON();
        fileObject = await this.getFileObject(pathArray);
      }
      return await this.getChildren(fileObject);
    }
  };
};

/**
 * Extends a file system so that it can mount file storages other than the root file storage
 * at arbitrary paths in the file system.
 * @mixinFunction
 * @param {FileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {BaseFileSystem}
 */
export let MountStorageMixin = (fileSystemClass) => {
  return class extends fileSystemClass {
    constructor(...args) {
      super(...args);
      this._mounts = [];
    }

    mount(fileObject, fileStorage, name){
      if (!name){
        throw new Error("Mount must have a name.");
      }
      this._mounts.push({
        fileObject: fileObject,
        fileStorage: fileStorage,
        name: name
      })
    }

    async getChildren(fileObject){
      let fileObjectsMap = await super.getChildren(fileObject);
      for (let mount of this._mounts){
        if (mount.fileObject.fileStorage === fileObject.fileStorage &&
            mount.fileObject.id === fileObject.id){
          let mountedRootDirectory = mount.fileStorage.rootFileNode;
          fileObjectsMap[mount.name] = new FileObject(mount.fileStorage, mountedRootDirectory, mount.name, fileObject);
        }
      }
      return fileObjectsMap;
    }

    clone(){
      let clone = super.clone();
      for (let mount of this._mounts){
        clone.mount(mount.fileObject, mount.fileStorage, mount.name);
      }
      return clone;
    }
  };
};


const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;


/**
 * Extends a file system so that it can mount file storages other than the root file storage
 * at arbitrary paths in the file system.
 * @mixinFunction
 * @param {FileSystem} fileSystemClass - A subclass of BaseFileSystem.
 * @returns {BaseFileSystem}
 */
export let ExecutableMixin = (FileSystemClass) => {
  return class extends FileSystemClass {
    constructor(...args) {
      super(...args);

      if (this.waitOn){
        this.import = this.waitOn(this.import);
      }

      this._executablePath = [
        ['bin']
      ];
    }

    /**
     * An array of absolute path arrays to directories that the exec command with search in
     * when the exec method is called.
     */
    get executablePath(){
      return this._executablePath;
    }

    set executablePath(value){
      this._executablePath = value;
    }

    /**
     * Execute the "main" function of the javascript file with the name given in the command parameter
     * with the given arguments. The variable "this" will be this fileSystem. The file must be located in the executable path, which is an array
     * of absolute path arrays.
     * @async
     * @param {string} command - The name of a javascript file located in the .bin directory.
     * @param {Array} args - The arguments to be provided to the "main" function in the file.
     */
    async exec(command, ...args){
      // Find a js file with the name in command and call the "main" function
      // in the file with the given args.
      let jsName = `${command}.js`;
      let pathsArray = this.executablePath.slice();
      let main;
      while (main === undefined && pathsArray.length > 0){
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
      if (main === undefined){
        throw new FileNotFoundError(`No file ${jsName} in path.`);
      }
      return await main.bind(this)(...args);
    }

    /**
     * Execute the "main" function of the javascript file. The variable "this" will be this fileSystem.
     * @async
     * @param {FileObject} fileObject - A fileObject that references a file containing javascript to be executed.
     * @param {Array} args - The arguments to be provided to the "main" function in the file.
     */
    async execFileObject(fileObject, ...args){
      let main = await this.importFromFileObject(fileObject, 'main');
      return await main.bind(this)(...args);
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
    async import(pathArray, variableName){
      // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
      // Right now executes script as function with FileSystem bound as "this". In an ideal world
      // with dynamic imports would import as a module and could use relative paths.
      let fileObject = await this.getFileObject(pathArray);
      return await this.importFromFileObject(fileObject, variableName);
    }

    /**
     * Execute the "main" function of the javascript file with the name given in the command parameter
     * with the given arguments. The file must be located in the executable path, which is an array
     * of absolute path arrays. The variable "this" will be this fileSystem.
     * @async
     * @param {FileObject} fileObject - A fileObject that references a file containing javascript from which to import.
     * @param {string} variableName - The name of the variable to import from the javascript file.
     * @return {*} The value of the variable.
     */
    async importFromFileObject(fileObject, variableName){
      let scriptString = await fileObject.readText();
      try{
        let func = new AsyncFunction(`${scriptString};return ${variableName};`);
        return await func.bind(this)();
      } catch (e) {
        throw new Error(`Error importing file ${fileObject}: ${e}`);
      }
    }
  };
};


export class FileSystem extends ExecutableMixin(HiddenReferenceLinkMixin(
                                MountStorageMixin(StateMixin(BaseFileSystem)))){
}
