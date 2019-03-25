import {parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer} from "../utils";

export class FileNotFoundError extends Error {
  constructor(message : string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class FileAlreadyExistsError extends Error {
  constructor(message : string) {
    super(message);
    this.name = this.constructor.name;
  }
}


export interface File {
  addOnChangeListener(listener : (file : File) => void): void;
  removeOnChangeListener(listener : (file : File) => void): void;

  /**
    * A string id of the file unique between this file and all descendants/ancestors.
   */
  readonly id : string;

  /**
   * The name of the file.
   */
  readonly name : string;

  /**
   * Whether or not this file is a directory.
   */
  readonly directory : boolean;

  /**
   * The url where the file can be accessed. Can be a data url.
   */
  readonly url : string | null;

  /**
   * The url for an image representation of the file.
   */
  readonly icon : string | null;

  /**
   * The file size in bytes.
   */
  readonly size : number;

  /**
   * The MIME type of the file.
   */
  readonly mimeType : string;

  /**
   * The time when the file was created.
   */
  readonly created : Date;

  /**
   * The time when the file was last modified.
   */
  readonly lastModified : Date;

  /**
   * Extra file metadata
   */
  readonly extra : Object

  /**
   * Read the file.
   */
  read() : Promise<ArrayBuffer>;

  /**
   * Update the data of the file. It will overwrite any existing data.
   */
  write(data : ArrayBuffer) : Promise<ArrayBuffer>;

  /**
   * Rename the file.
   */
  rename(newName : string) : Promise<void>;

  /**
   * Delete the file.
   */
  delete() : Promise<void>;

  /**
   * Copy the file into the targetDirectory.
   */
  copy(targetDirectory : Directory) : Promise<void>;

  /**
   * Move the file into the targetDirectory.
   */
  move(targetDirectory : Directory) : Promise<void>;
}


/**
 * @abstract
 * An object representing a file.
 */
export abstract class BasicFile implements File {
  private readonly onChangeListeners : Set<(file : File) => void> = new Set();

  abstract readonly id : string;
  abstract readonly name : string;
  abstract readonly url : string | null;
  abstract readonly icon : string | null;
  abstract readonly size : number;
  abstract readonly mimeType : string;
  abstract readonly created : Date;
  abstract readonly lastModified : Date;
  abstract readonly extra : Object;

  /**
   * Call whenever a file is changed.
   */
  protected onChange() {
    for (let listener of this.onChangeListeners) {
      listener(this);
    }
  }

  addOnChangeListener(listener : (file : File) => void) {
    this.onChangeListeners.add(listener);
  }

  removeOnChangeListener(listener : (file : File) => void) {
    this.onChangeListeners.delete(listener);
  }

  get directory() {
    return false;
  }

  abstract read() : Promise<ArrayBuffer>;
  abstract write(data : ArrayBuffer) : Promise<ArrayBuffer>;
  abstract rename(newName : string) : Promise<void>;
  abstract delete() : Promise<void>;

  /**
   * Read the file as a string.
   * @async
   * @returns {string} - File file data converted to a string.
   */
  async readText() {
    let arrayBuffer = await this.read();
    return parseTextArrayBuffer(arrayBuffer);
  }

  /**
   * Read the file as a json encoded string and convert to a Javascript Object.
   * @async
   * @returns {Object|Array} - File file data converted to a Javascript Object.
   */
  async readJSON() {
    let arrayBuffer = await this.read();
    return parseJsonArrayBuffer(arrayBuffer);
  }

  async copy(targetDirectory : Directory) {
    await targetDirectory.addFile(await this.read(), this.name, this.mimeType);
  }

  async move(targetDirectory : Directory) {
    await this.copy(targetDirectory);
    await this.delete();
  }

  toString() {
    return this.name;
  }
}


/**
 * An object representing a directory.
 */
export abstract class Directory extends BasicFile {
  static get mimeType() {
    return 'application/json';
  }

  get directory() {
    return true;
  }

  get mimeType() : string {
    return Directory.mimeType;
  }

  get size() : number {
    return 0;
  }

  get url() : string | null {
    return null;
  }

  async read() {
    let fileData = [];
    let children = await this.getChildren();
    for (let child of children) {
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

  async write(data : ArrayBuffer) : Promise<ArrayBuffer>{
    throw new Error("Cannot write to a directory.");
  }

  async copy(targetDirectory : Directory) {
    let copy = await targetDirectory.addDirectory(this.name);
    for (let child of await this.getChildren()){
      await child.copy(copy);
    }
  }

  /**
   * Get the file object at the given path relative to this directory.
   * @returns {Promise<File>} - The file object located at the given path.
   * @throws FileNotFoundError
   */
  async getFile(pathArray : string[]) : Promise<File> {
    if (pathArray.length === 0) {
      return this;
    }

    let name = pathArray[pathArray.length - 1];
    let parentPath = pathArray.slice(0, pathArray.length - 1);
    let parentFile = await this.getFile(parentPath);
    let fileObjectsArray;
    if (parentFile instanceof Directory){
      fileObjectsArray = await parentFile.getChildren();
    } else {
      throw new FileNotFoundError(`File ${name} not found.`);
    }

    let matchingFile;
    while (matchingFile === undefined) {
      let fileObject = fileObjectsArray.pop();
      if (fileObject === undefined){
        throw new FileNotFoundError(`File ${name} not found.`);
      }
      if (fileObject.name === name) {
        matchingFile = fileObject;
      }
    }
    return matchingFile;
  }

  abstract search(query : string) : Promise<SearchResult[]>;

  abstract addFile(fileData : ArrayBuffer, filename : string, mimeType? : string) : Promise<File>

  abstract addDirectory(name : string) : Promise<Directory>;

  abstract getChildren() : Promise<File[]>;
}

export interface SearchResult {
  path: string[],
  file: File,
}