import {parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer} from "../utils.js";

/**
 * An Object that contains metadata about a file.
 * @typedef {Object} FileNode
 * @property {string} id - A unique identifier for the file specific to its domain.
 * @property {boolean} name - The name of the file.
 * @property {boolean} url - The URL the file data can be accessed from. May be a Data URL.
 * @property {boolean} directory - Is the file a directory.
 * @property {boolean|null} icon - The url the file data can be accessed from.
 * @property {number|null} size - The size in bytes of the file.
 * @property {string} mimeType - The MIME type of the file.
 * @property {string} lastModified - An ISO 8601 date string of when the file was last modified.
 * @property {string} created - An ISO 8601 date string of when the file was created.
 * @property {boolean} hidden - Whether or not the file should be displayed in a user interface by default.
 */


export class FileObject {
  /**
   * An object representing a file or directory in a file system.
   * @param {FileNode} fileNode - The FileNode object representing the file
   * @param {FileObject|null} parentFileObject - The parent directory for this file. Null if root directory.
   * @param {AbstractFileStorage} fileStorage - the file storage for this file.
   */
  constructor(fileNode, parentFileObject, fileStorage) {
    this.fileNode = fileNode;
    this.parent = parentFileObject;
    this.fileStorage = fileStorage;
  }

  get path() {
    if (this.parent === null) {
      return [];
    }
    return this.parent.path.concat([this.name]);
  }
  toString(){
    return `/${this.path.join('/')}`;
  }
}

export class Link extends FileObject {
  /**
   * A FileObject that links to another file object. The file data is a json string with the
   * path of the file it links to.
   * @param {FileObject} fileObject - The file this links to.
   * @param {string} name - The name of the link
   * @param {FileObject|null} parent - The parent directory for this file. Null if root directory.
   */
  constructor(fileObject, name, parent){
    super(fileObject.fileStorage, fileObject.fileNode, name, parent);
    this._fileObject = fileObject;
  }

  static get mimeType(){
    return 'inode/symlink';
  }


  get mimeType() {
    return this.constructor.mimeType;
  }

  async read(params) {
    return stringToArrayBuffer(JSON.stringify(this._fileObject.path));
  }
}
