import {AbstractFileStorage} from "./base.js";
import {createClient} from "../../webdav-client/bundle.js";


export class WebDavStorage extends AbstractFileStorage {
  constructor(url){
    super();

    this._client = createClient(url);
  }

  async listDirectory(fileNode) {
    let dirCont = await this._client.getDirectoryContents(fileNode.id);
    console.log("dirCont");
    return super.listDirectory(fileNode);
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

  async readFileNode(fileNode, params) {
    console.log("READ", fileNode);
    if (fileNode.directory){
      let davFileData = await this._client.getDirectoryContents(fileNode.id);
      console.log("DAT", davFileData);
      let nodes = {};
      for (let fileData of davFileData ){
        let directory = fileData.type === "directory";
        nodes[fileData.basename] = {
          id: fileNode.id + '/' + fileData.basename,
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
      return new File([JSON.stringify(nodes)], fileNode.name, {type: fileNode.mimeType});
    }
    let stream = this._client.createReadStream(fileNode.id);
    console.log("STREAM", stream);
    return stream;
  }

  async writeFileNode(fileNode, data) {
    super.writeFileNode(fileNode, data);
  }

  async addFile(parentNode, file, filename) {
    super.addFile(parentNode, file, filename);
  }

  async addDirectory(parentNode, name) {
    super.addDirectory(parentNode, name);
  }

  async rename(fileNode, newName) {
    super.rename(fileNode, newName);
  }

  async delete(fileNode) {
    super.delete(fileNode);
  }

  async copy(source, targetParent) {
    super.copy(source, targetParent);
  }

  async move(source, targetParent) {
    super.move(source, targetParent);
  }

  async search(fileNode, query) {
    super.search(fileNode, query);
  }

  clone() {
    super.clone();
  }
}
