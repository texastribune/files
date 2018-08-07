import {AbstractFileStorage} from "./base.js";
import {FileNotFoundError} from "./base";

class VirtualFileSystem extends AbstractFileStorage {
    constructor(){
        super(root);

        this._index = 0;
        this._mounts = {};
    }


    async getRootFileNode() {
        super.getRootFileNode();
    }

    mount(id, storage){
        this._mounts[id] = storage;
    }

    async readFileNode(id, params) {
        let mount = this._mounts[id];
        if (mount !== undefined){
            return
        }
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
}