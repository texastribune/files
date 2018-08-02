import {FileAPIFileStorage} from "../files/storages/remote.js";

export default async function main(url, name) {
  await this.mount(this.path, new FileAPIFileStorage(url), name);
  await this.refresh();
  return `New FileAPI mount created at ${fileObject}`;
}
