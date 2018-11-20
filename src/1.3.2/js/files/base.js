import {parseJsonArrayBuffer, parseTextArrayBuffer} from "../utils.js";
import {stringToArrayBuffer} from "../utils.js";

export class FileNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * The data passed to create a AbstractFile.
 * @typedef {Object} FileData
 * @property {string} id - A unique identifier for the file specific to its storage. Does not change for the life of the file.
 * @property {string} name - The name of the file.
 * @property {boolean} directory - Is this file a directory
 * @property {string} url - The URL the file data can be accessed from. May be a Data URL.
 * @property {boolean} directory - Is the file a directory.
 * @property {string|null} [icon] - The url the file data can be accessed from.
 * @property {number|null} [size] - The size in bytes of the file.
 * @property {string} [mimeType] - The MIME type of the file.
 * @property {string} [lastModified] - An ISO 8601 date string of when the file was last modified.
 * @property {string} [created] - An ISO 8601 date string of when the file was created.
 * @property {Object|null} extra - Any extra properties
 */


/**
 * @abstract
 * An object representing a file.
 */
export class AbstractFile {
  constructor() {
    // this.write = this.wrapChangeFunc(this.write);
    // this.rename = this.wrapChangeFunc(this.rename);
    // this.delete = this.wrapChangeFunc(this.delete);
    // this.move = this.wrapChangeFunc(this.move);

    this._onChangeListeners = [];
  }

  // wrapChangeFunc(func) {
  //     let wrapped = async (...args) => {
  //         let ret = await func(...args);
  //         this.onChange(id);
  //         return ret;
  //     };
  //     return wrapped.bind(this);
  // }

  onChange() {
    for (let listener in this._onChangeListeners) {
      listener(this);
    }
  }

  addOnChangeListener(listener) {
    this._onChangeListeners.push(listener);
  }

  /**
   * @returns {boolean} - Is this file a directory.
   */
  get directory() {
    return false;
  }

  /**
   * @abstract
   * @returns {string} - A string id of the file unique between this file and all descendants/ancestors.
   */
  get id() {
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @returns {string} - The name of the file.
   */
  get name() {
    throw new Error("Not implemented");
  }


  /**
   * @returns {string} - The url where the file can be accessed.
   */
  get url() {
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @returns {string|null} - The parent directory of the file.
   */
  get icon() {
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @returns {number} - The parent directory of the file.
   */
  get size() {
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @returns {string} - The MIME type of the file.
   */
  get mimeType() {
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @returns {Date} - The time when the file was last modified.
   */
  get lastModified() {
    throw new Error("Not implemented");
  }

  /**
   * @abstract
   * @returns {Date} - The time when the file was created.
   */
  get created() {
    throw new Error("Not implemented");
  }

  // /**
  //  * @async
  //  * @returns {string[]} - The path of the file.
  //  */
  // async getPath() {
  //     let parent = await this.getParent();
  //     if (parent === null) {
  //         return [];
  //     }
  //     return await parent.getPath().concat([this.name]);
  // }
  //
  // /**
  //  * @async
  //  * @returns {AbstractFile} - The root directory for this file.
  //  */
  // async getRoot() {
  //     let file = this;
  //     let parent = await file.getParent();
  //     while (parent !== null) {
  //         file = parent;
  //         parent = await file.getParent();
  //     }
  //
  //     return file;
  // }
  //
  // /**
  //  * @abstract
  //  * @async
  //  * @returns {AbstractDirectory} - The parent directory of the file.
  //  */
  // async getParent() {
  //     throw new Error("Not implemented");
  // }

  /**
   * Read the file.
   * @abstract
   * @async
   * @param {Object} [params={}] - Read parameters.
   * @returns {ArrayBuffer} - An ArrayBuffer containing the file data.
   */
  async read(params) {
    throw new Error("Not implemented");
  }

  /**
   * Read the file.
   * @abstract
   * @async
   * @param {ArrayBuffer} data - Raw data to write to the file.
   * @returns {ArrayBuffer} - An ArrayBuffer containing the updated file data.
   */
  async write(data) {
    throw new Error("Not implemented");
  }

  /**
   * Read the file as a string.
   * @async
   * @param {Object} [params={}] - Read parameters.
   * @returns {string} - File file data converted to a string.
   */
  async readText(params) {
    let arrayBuffer = await this.read(params);
    return parseTextArrayBuffer(arrayBuffer);
  }

  /**
   * Read the file as a json encoded string and convert to a Javascript Object.
   * @async
   * @param {Object} [params={}] - Read parameters.
   * @returns {Object|Array} - File file data converted to a Javascript Object.
   */
  async readJSON(params) {
    let arrayBuffer = await this.read(params);
    return parseJsonArrayBuffer(arrayBuffer);
  }

  /**
   * Change the name of the file.
   * @abstract
   * @async
   * @param {string} newName - The new name for the file.
   */
  async rename(newName) {
    throw new Error("Not implemented");
  }

  /**
   * Delete the file from its storage location.
   * @abstract
   * @async
   */
  async delete() {
    throw new Error("Not implemented");
  }

  /**
   * Copy a file into the current directory.
   * @async
   * @param {AbstractFile} targetDirectory - The directory to copy this file to.
   */
  async copy(targetDirectory) {
    await targetDirectory.write(await this.read());
  }

  /**
   * Move a file into the current directory.
   * @async
   * @param {AbstractFile} targetDirectory - The directory to copy this file to.
   */
  async move(targetDirectory) {
    await this.copy(targetDirectory);
    await this.delete();
  }

  toString() {
    return this.name;
  }
}


/**
 * Adds the methods for a directory to a file.
 * @mixin DirectoryMixin
 * @param {AbstractFile} FileClass - AbstractFile or a subclass of it.
 * @returns {AbstractDirectory} The mixin class.
 */
export const DirectoryMixin = (FileClass) => {
  return class Directory extends FileClass {
    get directory() {
      return true;
    }

    get mimeType() {
      return AbstractDirectory.mimeType;
    }

    get size() {
      return null;
    }

    get url() {
      return null;
    }

    async read(params) {
      let fileData = [];
      let children = await this.getChildren();
      for (let child of children) {
        console.log("CCCC", child);
        fileData.push({
          id: child.id,
          name: child.name,
          directory: child.directory,
          url: child.url,
          icon: child.icon,
          size: child.size,
          mimeType: child.mimeType,
          lastModified: child.lastModified.toISOString(),
          created: child.created.toISOString(),
          extra: child.extra
        })
      }
      let jsonString = JSON.stringify(fileData);
      return stringToArrayBuffer(jsonString);
    }

    async write(data) {
      throw new Error("Cannot write to a directory.");
    }

    /**
     * Get the file object at the given path relative to this directory.
     * @async
     * @memberof DirectoryMixin#
     * @param {string[]} pathArray - An array of strings representing the path of the file to read relative to this directory.
     * @returns {AbstractFile} - The file object located at the given path.
     * @throws FileNotFoundError
     */
    async getFile(pathArray) {
      if (!(pathArray instanceof Array)) {
        throw Error(`Path must be an array, not ${typeof pathArray}`);
      }
      if (pathArray.length === 0) {
        return this;
      }

      let name = pathArray[pathArray.length - 1];
      let parentPath = pathArray.slice(0, pathArray.length - 1);
      let parentFile = await this.getFile(parentPath);
      let fileObjectsArray = await parentFile.getChildren();
      let matchingFile;
      while (matchingFile === undefined && fileObjectsArray.length > 0) {
        let fileObject = fileObjectsArray.pop();
        if (fileObject.name === name) {
          matchingFile = fileObject;
        }
      }
      if (matchingFile === undefined) {
        throw new FileNotFoundError(`File ${name} not found.`);
      }
      return matchingFile;
    }

    /**
     * Search the file and all of its children recursively based on the query.
     * @abstract
     * @memberof DirectoryMixin#
     * @async
     * @param {string} query - Words to be searched seperated by spaces.
     * @returns {AbstractFile[]} - A list of file objects.
     */
    async search(query) {
      throw new Error("Not implemented");
    }

    /**
     * Add a file to the current directory.
     * @abstract
     * @async
     * @memberof DirectoryMixin#
     * @param {ArrayBuffer} fileData - The file or a dataUrl of a file to be added to the current directory.
     * @param {string} [filename] - A name for the new file.
     * @param {string} [mimeType=application/octet-stream] - A mimeType for the file.
     * @returns {AbstractFile} - The data for the newly created directory
     */
    async addFile(fileData, filename, mimeType) {
      throw new Error("Not implemented");
    }

    /**
     * Add a directory to the current directory.
     * @abstract
     * @async
     * @memberof DirectoryMixin#
     * @param {string} name - A name for the new directory.
     * @returns {AbstractFile} - The newly created directory.
     */
    async addDirectory(name) {
      throw new Error("Not implemented");
    }

    /**
     * Return the child files and directories of this if it is a directory.
     * @abstract
     * @async
     * @memberof DirectoryMixin#
     * @returns {AbstractFile[]} - The children of this directory. If it is a file, should be empty.
     */
    async getChildren() {
      throw new Error("Not implemented");
    }
  }
};


/**
 * @abstract
 * @extends AbstractFile
 * @mixes DirectoryMixin
 * An object representing a directory.
 */
export class AbstractDirectory extends DirectoryMixin(AbstractFile) {
  static get mimeType() {
    return 'application/json';
  }
}