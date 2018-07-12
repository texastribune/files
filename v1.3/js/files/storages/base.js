import {parseJsonFile} from "../../utils.js";


export class FileNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AbstractFileStorage {
  /**
   * The base class to use for building and implementation of a file system. It allows for
   * interaction with a hierarchical tree structure of files connected by directories. The
   * file system maintains a current directory and the data in that directory.
   */
  constructor() {
  }

  /**
   * Return a javascript Object mapping file names to file objects for each file in the
   * directory represented by the given fileObject.
   * @async
   * @param {FileNode} fileNode - FileNode referring to the directory to list.
   * @returns {Object} - Object mapping filename to FileNode for each file in the given directory.
   */
  async listDirectory(fileNode) {
    let directoryFile = await this.readFileNode(fileNode);
    return await parseJsonFile(directoryFile);
  }

  // Abstract methods.

  /**
   * The file object representing the root directory.
   * @abstract
   * @returns {FileNode} - FileNode representing the root directory.
   */
  get rootFileNode() {
    throw new Error("Not implemented")
  }

  /**
   * Read the file.
   * @async
   * @abstract
   * @param {FileNode} fileNode - FileNode referring to the file to be read.
   * @param {Object} params - Query params to read with.
   * @returns {Blob} - Blob (https://developer.mozilla.org/en-US/docs/Web/API/Blob)
   */
  async readFileNode(fileNode, params) {
    throw new Error("Not implemented")
  }

  /**
   * Write to the file.
   * @async
   * @abstract
   * @param {FileNode} fileNode - FileNode referring to the file to be read.
   * @param {File|Blob} data - File or Blob to write.
   * @returns {Blob} - Blob (https://developer.mozilla.org/en-US/docs/Web/API/Blob)
   */
  async writeFileNode(fileNode, data) {
    throw new Error("Not implemented")
  }

  /**
   * Add a file to the current directory.
   * @async
   * @abstract
   * @param {FileNode} parentNode - FileNode representing the parent directory for the new file
   * @param {File|string} file - The file or a dataUrl of a file to be added to the current directory.
   * @param {string} [filename] - A name for the new file.
   * @returns {FileNode} - The data for the newly created directory
   */
  async addFile(parentNode, file, filename) {
    throw new Error("Not implemented")
  }

  /**
   * Add a directory to the current directory.
   * @async
   * @abstract
   * @param {FileNode} parentNode - FileNode representing the parent directory for the new directory
   * @param {string} name - A name for the new directory.
   * @returns {FileNode} - The data for the newly created directory
   */
  async addDirectory(parentNode, name) {
    throw new Error("Not implemented")
  }

  /**
   * Rename a file in the current directory.
   * @async
   * @abstract
   * @param {FileNode} fileNode - The name of the file to rename. Must be in current directory.
   * @param {string} newName - The name to change the filename to.
   */
  async rename(fileNode, newName) {
    throw new Error("Not implemented")
  }

  /**
   * Delete a file in the current directory.
   * @async
   * @abstract
   * @param {FileNode} fileNode - The name of the file to be deleted. Must be in current directory.
   */
  async delete(fileNode) {
    throw new Error("Not implemented")
  }

  /**
   * Copy a file into the current directory.
   * @async
   * @abstract
   * @param {fileNode} source - The file node of the file to be copied to targetParent.
   * @param {fileNode} targetParent - The target directory to put the file.
   */
  async copy(source, targetParent) {
    throw new Error("Not implemented")
  }

  /**
   * Move a file into the current directory.
   * @async
   * @abstract
   * @param {fileNode} source - The file node of the file to be moved.
   * @param {fileNode} targetParent - The target directory to put the file.
   */
  async move(source, targetParent) {
    throw new Error("Not implemented")
  }

  /**
   * Search the current directory and its subdirectories recursively for files matching the given search term.
   * @async
   * @abstract
   * @param {fileNode} fileNode - The file node of the file to be searched.
   * @param {string} query - Search terms.
   * @returns {FileNode[]} - The data for the newly created directory
   */
  async search(fileNode, query) {
    throw new Error("Not implemented")
  }

  /**
   * Create a duplicate instance of this file system.
   * @abstract
   * @returns {AbstractFileStorage} - A new instance with the same state.
   */
  clone() {
    throw new Error("Not implemented")
  };
}
