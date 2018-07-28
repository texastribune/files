import {AbstractFileStorage} from "./base.js";
import {stringToArrayBuffer} from "../../utils.js";
import * as fs from 'fs';
import * as path from 'path';


function nodeFSFuncAsyncWrapper(func) {
    return async (...args) => {
        return await new Promise((resolve, reject) => {
            let callback = (err, stats) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(stats);
                }
            };
            args.push(callback);
            func(...args);
        })
    }
}


export class NodeFileStorage extends AbstractFileStorage {
    constructor(rootPath) {
        super();

        this.rootPath = rootPath || '/';

        this.stat = nodeFSFuncAsyncWrapper(fs.stat);
        this.readFile = nodeFSFuncAsyncWrapper(fs.readFile);
        this.writeFile = nodeFSFuncAsyncWrapper(fs.writeFile);
        this.readdir = nodeFSFuncAsyncWrapper(fs.readdir);
        this.appendFile = nodeFSFuncAsyncWrapper(fs.appendFile);
        this.mkdir = nodeFSFuncAsyncWrapper(fs.mkdir);
        this.fsrename = nodeFSFuncAsyncWrapper(fs.rename);
        this.unlink = nodeFSFuncAsyncWrapper(fs.unlink);
    }

    async _getFileNodeFromFSPath(fsPath) {
        let stat = await this.stat(fsPath);
        let name = path.basename(fsPath);
        return {
            id: fsPath,
            name: name,
            directory: stat.isDirectory(),
            mimeType: 'application/octet-stream',
            size: stat.size,
            created: stat.birthtime.toISOString(),
            lastModified: stat.ctime.toISOString(),
            icon: null,
            hidden: name.startsWith('.')
        }
    }

    async getRootFileNode() {
        return await this._getFileNodeFromFSPath(this.rootPath);
    }

    async readFileNode(id, params) {
        let fileNode = await this._getFileNodeFromFSPath(id);
        if (fileNode.directory) {
            let ret = {};
            let nameArray = await this.readdir(id);
            for (let name of nameArray) {
                ret[name] = await this._getFileNodeFromFSPath(path.join(id, name));
            }
            return stringToArrayBuffer(JSON.stringify(ret));
        }
        let typedArray = await this.readFile(id);
        return typedArray.buffer;
    }

    async writeFileNode(id, data) {
        await this.writeFile(id, data);
    }

    async addFile(parentId, fileData, filename, type) {
        if (!(fileData instanceof ArrayBuffer)) {
            throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`)
        }
        let filePath = path.join(parentId, filename);
        await this.appendFile(filePath, fileData);
        return await this._getFileNodeFromFSPath(filePath);
    }

    async addDirectory(parentId, name) {
        let dirPath = path.join(parentId, name);
        await this.mkdir(dirPath, null);
        return await this._getFileNodeFromFSPath(dirPath);
    }

    async rename(id, newName) {
        let dirName = path.dirname(id);
        await this.fsrename(id, path.join(dirName, newName));
    }

    async delete(id) {
        await this.unlink(id);
    }

    /**
     * Copy a file into the current directory.
     * @async
     * @abstract
     * @param {string} source - The id of the file to be copied.
     */
    async copy(source) {
        throw new Error("Not implemented")
    }

    /**
     * Move a file into the current directory.
     * @async
     * @abstract
     * @param {string} source - The id of the file to be moved.
     */
    async move(source) {
        throw new Error("Not implemented")
    }

    /**
     * Search the current directory and its subdirectories recursively for files matching the given search term.
     * @async
     * @abstract
     * @param {string} query - Search terms.
     * @returns {FileObject[]} - The data for the newly created directory
     */
    async search(query) {
        throw new Error("Not implemented")
    }

    /**
     * Create a duplicate instance of this file system.
     * @abstract
     * @returns {AbstractFileSystem} - A new instance with the same state.
     */
    clone() {
        throw new Error("Not implemented")
    };
}