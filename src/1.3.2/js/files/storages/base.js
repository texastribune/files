

export class FileNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * The base class to use for building and implementation of a file system. It allows for
 * interaction with a hierarchical tree structure of files connected by directories. The
 * file system maintains a current directory and the data in that directory.
 */
export class AbstractFileStorage {
  /**
   * Should be overridden to return false if the storage does not save and return the mime type given in
   * addFile.
   * @static
   * @returns {boolean} - Whether or not mimeType is stored by this storage.
   */
  static get preservesMimeType(){
    return true;
  }

  /**
   * Get the file object representing the root directory.
   * @async
   * @abstract
   * @returns {FileNode} - FileNode representing the root directory.
   */
  async getRootFileNode() {
    throw new Error("Not implemented")
  }

  /**
   * Read the file.
   * @async
   * @abstract
   * @param {string} id - Id referring to the file to be read.
   * @param {Object} params - Query params to read with.
   * @returns {ArrayBuffer} - An ArrayBuffer with the file data.
   */
  async readFileNode(id, params) {
    throw new Error("Not implemented")
  }

  /**
   * Write to the file.
   * @async
   * @abstract
   * @param {string} id - Id referring to the file to be written to.
   * @param {ArrayBuffer} data - An ArrayBuffer of data to write.
   * @returns {ArrayBuffer} - An ArrayBuffer with the updated file data.
   */
  async writeFileNode(id, data) {
    throw new Error("Not implemented")
  }

  /**
   * Add a file to the current directory.
   * @async
   * @abstract
   * @param {string} parentId - Id referring to the directory file to add the file.
   * @param {ArrayBuffer} fileData - The file data as an ArrayBuffer or a dataUrl of a file to be added to the current directory.
   * @param {string} [filename] - A name for the new file.
   * @param {string} [mimeType] - The mimeType of the file. Defaults to application/octet-stream
   * @returns {FileNode} - The data for the newly created directory
   */
  async addFile(parentId, fileData, filename, mimeType) {
    throw new Error("Not implemented")
  }

  /**
   * Add a directory to the current directory.
   * @async
   * @abstract
   * @param {string} parentId - Id referring to the directory file to add the directory.
   * @param {string} name - A name for the new directory.
   * @returns {FileNode} - The data for the newly created directory
   */
  async addDirectory(parentId, name) {
    throw new Error("Not implemented")
  }

  /**
   * Rename a file in the current directory.
   * @async
   * @abstract
   * @param {string} id - Id referring to the file to be renamed.
   * @param {string} newName - The name to change the filename to.
   */
  async rename(id, newName) {
    throw new Error("Not implemented")
  }

  /**
   * Delete a file in the current directory.
   * @async
   * @abstract
   * @param {string} id - Id referring to the file to be deleted.
   */
  async delete(id) {
    throw new Error("Not implemented")
  }

  /**
   * Copy a file into the current directory.
   * @async
   * @abstract
   * @param {string} sourceId - The id of the file to be copied to targetParent.
   * @param {string} targetParentId - The id of the target directory to put the file.
   */
  async copy(sourceId, targetParentId) {
    throw new Error("Not implemented")
  }

  /**
   * Move a file into the current directory.
   * @async
   * @abstract
   * @param {string} sourceId - The id of the file to be moved to targetParent.
   * @param {string} targetParentId - The id of the target directory to put the file.
   */
  async move(sourceId, targetParentId) {
    throw new Error("Not implemented")
  }

  /**
   * Search the current directory and its subdirectories recursively for files matching the given search term.
   * @async
   * @abstract
   * @param {string} id - The id of the file to be searched.
   * @param {string} query - Search terms.
   * @returns {FileNode[]} - The data for the newly created directory
   */
  async search(id, query) {
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
