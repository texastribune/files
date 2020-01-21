import * as files from "./base.js";
import { statSync, watch, existsSync } from "fs";
import { promises as fs } from "fs";
import * as path from 'path';
import { FileAlreadyExistsError } from "./base.js";
/**
 * A file on the local system using NodeJS file operations.
 */
export class NodeFile extends files.BasicFile {
    constructor(path, stat) {
        super();
        this.extra = {};
        this.path = path;
        this.stat = stat || statSync(path);
        this.watcher = watch(this.path, () => {
            this.dispatchChangeEvent();
        });
    }
    get id() {
        return this.path;
    }
    get name() {
        return path.basename(this.path);
    }
    get url() {
        return null;
    }
    get icon() {
        return null;
    }
    get size() {
        return this.stat.size;
    }
    get lastModified() {
        return this.stat.birthtime;
    }
    get created() {
        return this.stat.ctime;
    }
    get mimeType() {
        return 'application/octet-stream';
    }
    async rename(newName) {
        let dirName = path.dirname(this.id);
        let newPath = path.join(dirName, newName);
        await fs.rename(this.id, newPath);
        this.path = newPath;
        this.watcher.close();
        this.watcher = watch(this.path, () => {
            this.dispatchChangeEvent();
        });
    }
    async delete() {
        this.watcher.close();
        await fs.unlink(this.id);
    }
    async read() {
        let typedArray = await fs.readFile(this.id);
        return typedArray.buffer.slice(typedArray.byteOffset, typedArray.byteLength + typedArray.byteOffset);
    }
    async write(data) {
        await fs.writeFile(this.id, Buffer.from(data));
        return await fs.readFile(this.id);
    }
}
export class NodeDirectory extends files.Directory {
    constructor(path, stat) {
        super();
        this.extra = {};
        this.path = path;
        this.stat = stat || statSync(path);
        this.watcher = watch(this.path, { recursive: true }, () => {
            this.dispatchChangeEvent();
        });
    }
    get id() {
        return this.path;
    }
    get name() {
        return path.basename(this.path);
    }
    get icon() {
        return null;
    }
    get lastModified() {
        return this.stat.birthtime;
    }
    get created() {
        return this.stat.ctime;
    }
    async rename(newName) {
        let dirName = path.dirname(this.id);
        let newPath = path.join(dirName, newName);
        await fs.rename(this.id, newPath);
        this.path = newPath;
        this.watcher.close();
        this.watcher = watch(this.path, { recursive: true }, () => {
            this.dispatchChangeEvent();
        });
    }
    async delete() {
        this.watcher.close();
        for (let child of await this.getChildren()) {
            await child.delete();
        }
        await fs.rmdir(this.id);
    }
    async searchDir(id, query) {
        let results = [];
        let nameArray = await fs.readdir(id);
        for (let childName of nameArray) {
            let childId = path.join(id, childName);
            try {
                let stat = await fs.stat(childId);
                let isDir = stat.isDirectory();
                if (childName.includes(query)) {
                    results.push({ path: [childName,], id: childId, stat: stat });
                }
                if (isDir) {
                    let subResults = await this.searchDir(childId, query);
                    for (let result of subResults) {
                        result.path.unshift(childName);
                    }
                    results = results.concat(subResults);
                }
            }
            catch (e) {
                // File possible not found. Could have been removed concurrently.
            }
        }
        return results;
    }
    async search(query) {
        let results = [];
        let statResults = await this.searchDir(this.id, query);
        for (let result of statResults) {
            if (result.stat.isDirectory()) {
                results.push({
                    path: result.path,
                    file: new NodeDirectory(result.id, result.stat),
                });
            }
            else {
                results.push({
                    path: result.path,
                    file: new NodeFile(result.id, result.stat),
                });
            }
        }
        return results;
    }
    async addFile(fileData, filename, mimeType) {
        if (!(fileData instanceof ArrayBuffer)) {
            throw new Error(`File data must be ArrayBuffer not ${typeof fileData}.`);
        }
        let filePath = path.join(this.id, filename);
        if (existsSync(filePath)) {
            throw new FileAlreadyExistsError(`file named ${name} already exists`);
        }
        await fs.appendFile(filePath, Buffer.from(fileData));
        let stat = await fs.stat(filePath);
        return new NodeFile(filePath, stat);
    }
    async addDirectory(name) {
        let dirPath = path.join(this.id, name);
        if (existsSync(dirPath)) {
            throw new FileAlreadyExistsError(`file named ${name} already exists`);
        }
        await fs.mkdir(dirPath, null);
        let stat = await fs.stat(dirPath);
        return new NodeDirectory(dirPath, stat);
    }
    async getChildren() {
        let children = [];
        let nameArray = await fs.readdir(this.id);
        for (let name of nameArray) {
            let childPath = path.join(this.id, name);
            let stat = await fs.stat(childPath);
            if (stat.isDirectory()) {
                children.push(new NodeDirectory(childPath, stat));
            }
            else {
                children.push(new NodeFile(childPath, stat));
            }
        }
        return children;
    }
}
