import {PhotoshelterStorage} from "../files/storages/photoshelter.js";
import {BaseFileSystem} from "../files/systems.js";


export default async function main(email, password, apiKey) {
  let storage = new PhotoshelterStorage(email, password, apiKey);
  let system = new BaseFileSystem(storage);
  await this.mount(this.path, system);
  await this.refresh();
  return `New Photoshelter mount created at ${this.path.join('/')}`;
}
