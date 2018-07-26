import {AbstractFileStorage} from "./base.js";
import {createClient} from "../../webdav-client/bundle.js";


export class WebDavStorage extends AbstractFileStorage {
  constructor(url){
    super();

    this._client = createClient(url);
  }

  get rootFileNode() {
    console.log("ROOT");
    let currentDateString = new Date().toISOString();
    return {
      id: '/',
      name: 'root',
      url: '',
      directory: true,
      icon: null,
      size: 0,
      mimeType: 'application/json',
      lastModified: currentDateString,
      created: currentDateString
    };
  }

  async readFileNode(id, params) {
    console.log("READ", id);
    let stat = this._client.stat(id);
    if (stat.type === 'directory'){
      let davFileData = await this._client.getDirectoryContents(id);
      console.log("DAT", davFileData);
      let nodes = {};
      for (let fileData of davFileData ){
        let directory = fileData.type === "directory";
        nodes[fileData.basename] = {
          id: id + '/' + fileData.basename,
          name: fileData.basename,
          url: '',
          directory: directory,
          icon: null,
          size: fileData.size,
          mimeType: directory ? 'application/json' : 'application/octet-stream',
          lastModified: new Date(fileData.lastmod).toISOString(),
          created: new Date(fileData.lastmod).toISOString()
        }
      }
      return new File([JSON.stringify(nodes)], stat.filename, {type: stat.mime});
    }
    let stream = this._client.createReadStream(id);
    console.log("STREAM", stream);
    return stream;
  }

  async writeFileNode(id, data) {
    super.writeFileNode(id, data);
  }

  async addFile(parentId, file, filename) {
    super.addFile(parentId, file, filename);
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
