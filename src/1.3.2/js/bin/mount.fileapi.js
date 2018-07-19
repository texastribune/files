import {FileAPIFileStorage} from "../files/storages/remote.js";

export default async function main(url, name) {
  let fileObject = await this.getFileObject(this.path, false);
  this.mount(fileObject, new FileAPIFileStorage(url), name);
  await this.refresh();
  return `New FileAPI mount created at ${fileObject}`;
}
