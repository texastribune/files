import {AbstractFileStorage} from "./base.js";
import {FileNotFoundError} from "./base";

class VirtualFileSystem extends AbstractFileStorage {
    constructor(){
        super();

        this._index = 0;
        this._mounts = {};
    }


    async getRootFileNode() {
        super.getRootFileNode();
    }

    _resolveFS(id){
        let parts = id.split(":");
        let mountId = parts.shift();
        let remainder = parts.join(":");

        let storage = this._mounts[mountId];
        if (storage === undefined){
            throw FileNotFoundError();
        }

        return [storage, remainder];
    }

    _encodeId(storageId, id){
        return
    }

    async readFileNode(id, params) {
        let [storage, storageId] = this._resolveFS(id);
        let fileNode = await storage.readFileNode(storageId, params);
        fileNode.id = id;
        return fileNode;
    }

    async writeFileNode(id, data) {
        let [storage, storageId] = this._resolveId(id);
        return await storage.writeFileNode(storageId, data);
    }

    async addFile(parentId, fileData, filename, mimeType) {
        super.addFile(parentId, fileData, filename, mimeType);
    }

    async addDirectory(parentId, name) {
        super.addDirectory(parentId, name);
    }

    async rename(id, newName) {
        super.rename(id, newName);
    }

    async delete(id) {
        super.delete(id);
    }

    async copy(sourceId, targetParentId) {
        super.copy(sourceId, targetParentId);
    }

    async move(sourceId, targetParentId) {
        super.move(sourceId, targetParentId);
    }

    async search(id, query) {
        super.search(id, query);
    }

    clone() {
        super.clone();
    }

    async mount(path, storage){
        let fileObject = await this.getFileObject(path);
        this._mounts[fileObject.id] = new VirtualFileSystem(storage);
    }
}