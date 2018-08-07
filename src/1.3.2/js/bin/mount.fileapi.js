import {FileAPIFileStorage} from "../files/storages/remote.js";
import {BaseFileSystem} from "../files/systems.js";

export default async function main(url) {
  let storage = new FileAPIFileStorage(url);
  let system = new BaseFileSystem(storage);
  await this.mount(this.path, system);
  await this.refresh();
  return `New FileAPI mount created at ${this.path.join('/')}`;
}
