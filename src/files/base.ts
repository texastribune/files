import {parseJsonArrayBuffer, parseTextArrayBuffer, stringToArrayBuffer} from "../utils.js";

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


/**
 * Get the file object at the given path relative to the given directory.
 * @async
 * @param pathArray - The path relative to the given directory.
 * @param directory - The directory from which to walk the path.
 * @returns {Promise<File>} - The file object located at the given path.
 * @throws FileNotFoundError
 */
export async function walkPath(pathArray : string[], directory : Directory) : Promise<File> {
  if (pathArray.length === 0) {
    return directory;
  }

  let name = pathArray[pathArray.length - 1];
  let parentPath = pathArray.slice(0, pathArray.length - 1);
  let parentFile = await walkPath(parentPath, directory);
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


export type listener = (file : File) => void;

/**
 * @abstract
 * An object representing a file.
 */
export abstract class BasicFile implements File {
  private readonly onChangeListeners : Set<listener> = new Set();

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
  dispatchChangeEvent() {
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
   */
  async readText() : Promise<string> {
    let arrayBuffer = await this.read();
    return parseTextArrayBuffer(arrayBuffer);
  }

  /**
   * Read the file as a json encoded string and convert to a Javascript Object.
   * @async
   */
  async readJSON() : Promise<any> {
    let arrayBuffer = await this.read();
    return parseJsonArrayBuffer(arrayBuffer);
  }

  async copy(targetDirectory : Directory) {
    let data = await this.read();
    await targetDirectory.addFile(data, this.name, this.mimeType);
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
  getFile(pathArray : string[]) : Promise<File> {
    return walkPath(pathArray, this);
  }

  /**
   * Searches the directory and its children recursively based on the given search query.
   */
  abstract search(query : string) : Promise<SearchResult[]>;

  /**
   * Adds a file to the directory and returns it.
   */
  abstract addFile(fileData : ArrayBuffer, filename : string, mimeType? : string) : Promise<File>

  abstract addDirectory(name : string) : Promise<Directory>;

  /**
   * Returns all of the children of the directory. The children should all implement the File
   * interface.
   */
  abstract getChildren() : Promise<File[]>;
}

export interface SearchResult {
  /**
   * The path relative to the directory being searched
   */
  path: string[],

  /**
   * The file found in the directory
   */
  file: File,
}


export interface DirectoryData {
  id: string,
  name: string,
  directory: boolean,
  url: string | null,
  icon: string | null,
  size: number,
  mimeType: string,
  lastModified: string,
  created: string,
  extra: Object,
}