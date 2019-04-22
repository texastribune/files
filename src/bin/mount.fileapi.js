import {FileAPIFileStorage} from "../files/storages/remote.js";

export default async function main(url) {
  let storage = new FileAPIFileStorage(url);
  await this.mount(this.path, system);
  await this.refresh();
  return `New FileAPI mount created at ${this.path.join('/')}`;
}
