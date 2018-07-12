import {PhotoshelterStorage} from "../files/storages/photoshelter.js";


export default async function main(email, password, apiKey, name) {
  let fileObject = await this.getFileObject(this.path, false);
  let storage = new PhotoshelterStorage(email, password, apiKey);
  this.mount(fileObject, storage, name);
  await this.refresh();
  return `New Photoshelter mount created at ${fileObject}`;
}
