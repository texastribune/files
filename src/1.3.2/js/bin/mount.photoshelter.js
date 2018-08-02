import {PhotoshelterStorage} from "../files/storages/photoshelter.js";


export default async function main(email, password, apiKey, name) {
  let storage = new PhotoshelterStorage(email, password, apiKey);
  await this.mount(this.path, storage, name);
  await this.refresh();
  return `New Photoshelter mount created at ${this.path.join('/')}`;
}
