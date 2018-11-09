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


/**
 * A storage class that stores file on the local system using NodeJS file operations.
 *  @extends AbstractFileStorage
 */
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

    static get preservesMimeType(){
        return false;
    }

    async _getFileNodeFromFSPath(fsPath) {
        let stat = await this.stat(fsPath);
        let name = path.basename(fsPath);
        let directory = stat.isDirectory();
        return {
            id: fsPath,
            name: name,
            directory: directory,
            mimeType: directory ? 'application/json' : 'application/octet-stream',
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
            let childNodes = [];
            let nameArray = await this.readdir(id);
            for (let name of nameArray) {
                let childNode = await this._getFileNodeFromFSPath(path.join(id, name));
                childNodes.push(childNode);
            }
            return stringToArrayBuffer(JSON.stringify(childNodes));
        }
        let typedArray = await this.readFile(id);
        return typedArray.buffer;
    }

    async writeFileNode(id, data) {
        await this.writeFile(id, new Buffer.from(data));
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

    async copy(sourceId, targetParentId) {
        throw new Error("Not implemented")
    }

    async move(sourceId, targetParentId) {
        throw new Error("Not implemented")
    }

    async search(id, query) {
        throw new Error("Not implemented")
    }

    clone() {
        throw new Error("Not implemented")
    };
}