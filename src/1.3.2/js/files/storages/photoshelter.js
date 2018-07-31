import {AbstractFileStorage} from "./base.js";

export class PhotoshelterAPI {
    constructor(email, password, apikey){
    this._email = email;
    this._password = password;
    this._apiKey = apikey;
    this._authToken = null;
  }

  static get url(){
    return new URL('https://www.photoshelter.com');
  }

  async _getAuthToken(){
    if (this._authToken === null){
      let url = this.constructor.url;
      url.pathname = '/psapi/v3/mem/authenticate';
      url.searchParams.set('api_key', this._apiKey);
      let data = {
        email: this._email,
        password: this._password,
        mode: 'token'
      };
      let response = await fetch(url.toString(), {
        body: JSON.stringify(data),
        method: 'POST'
      });
      if (response.ok){
        let data = response.json().data;
        this._authToken = data.token;
        if (data.hasOwnProperty('org')){
          let url = this.constructor.url;
          url.pathname = `/psapi/v3/mem/organization/${data.org[0].id}/authenticate`;
          let response = await fetch(url.toString(), {
            headers: await this.getHeaders(),
            method: 'POST'
          });
          if (!response.ok){
            throw Error("Error authentication Photoshelter organization");
          }
        }
      } else {
        throw Error("Error authentication Photoshelter");
      }
    }
    return this._authToken;
  }

  async getHeaders(){
    return {
      'X-PS-Api-Key': this._apiKey,
      'X-PS-Auth-Token': await this._getAuthToken()
    }
  }

  async _get(url, retry){
      retry = retry === undefined ? true : retry;
      let response = await fetch(url.toString(), {
        headers: await this.getHeaders()
      });
      if (!response.ok){
        if (retry){
          this._authToken = null;
          return await this._get(url, false);
        } else {
          throw new Error("Photoshelter error: " + response.statusText);
        }
      }
      return response;
  }

  async _post(url, body, retry){
      retry = retry === undefined ? true : retry;
      let headers = await this.getHeaders();
      headers['Content-Type'] ='application/json';
      let response = await fetch(url.toString(), {
        headers: headers,
        body: body,
        method: 'POST'
      });
      if (!response.ok){
        if (retry){
          this._authToken = null;
          return await this._post(url, body, false);
        } else {
          throw new Error("Photoshelter error: " + response.statusText);
        }
      }
      return response;
  }

  async getImageFile(photoId){
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/image/${photoId}/download`;
      url.searchParams.set('f_embed', '');
      let response = await this._get(url.toString());
      let contDisp = response.headers.get("content-disposition");
      let blob = await response.blob();
      return new File([blob], contDisp, {type: blob.type, lastModified: Date.now()});
  }

  async getImageData(photoId){
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/image/${photoId}`;
      let response = await this._get(url.toString());
      return response.json().data.image;
  }

  async getImageGalleries(galleryId){
      galleryId = galleryId || 'root';
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/image/${galleryId}/galleries`;
      url.searchParams.set('extend', JSON.stringify({Gallery: {}}));
      let response = await this._get(url.toString());
      return response.json().data.ImageGallery;
  }

  async getImageLink(photoId){
    let url = this.constructor.url;
    url.pathname = `/psapi/v3/mem/image/${photoId}/link`;
    let response = await this._get(url.toString());
    return response.json().data.ImageLink.link;
  }

  async getCollectionData(collectionId){
      collectionId = collectionId || 'root';
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/collection/${collectionId}`;
      let response = await this._get(url.toString());
      return response.json().data.Collection;
  }

  async getCollectionParent(collectionId){
      collectionId = collectionId || 'root';
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/collection/${collectionId}/parent`;
      let response = await this._get(url.toString());
      return response.json().data.Collection;
  }

  async getCollectionChildren(collectionId){
      collectionId = collectionId || 'root';
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/collection/${collectionId}/children`;
      url.searchParams.set('extend', JSON.stringify({Collection: {}, Gallery: {}}));
      let response = await this._get(url.toString());
      return response.json().data.Children;
  }

  async getGalleryData(galleryId){
      galleryId = galleryId || 'root';
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/gallery/${galleryId}`;
      let response = await this._get(url.toString());
      return response.json().data.Gallery;
  }

  async getGalleryParent(galleryId){
      galleryId = galleryId || 'root';
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/gallery/${galleryId}/parent`;
      url.searchParams.set('extend', JSON.stringify({Collection: {}}));
      let response = await this._get(url.toString());
      return response.json().data.Parents;
  }

  async getGalleryChildren(galleryId){
      galleryId = galleryId || 'root';
      let url = this.constructor.url;
      url.pathname = `/psapi/v3/mem/gallery/${galleryId}/children`;
      url.searchParams.set('extend', JSON.stringify({Image: {}, ImageLink: {}}));
      let response = await this._get(url.toString());
      return response.json().data.GalleryImage;
  }

  async search(string){
      let url = this.constructor.url;
      url.pathname = '/psapi/v3/mem/image/search';
      let terms = string.split(" ");
      url.searchParams.set('terms', JSON.stringify(terms));
      url.searchParams.set('extend', JSON.stringify({Image: {}, ImageLink: {}}));
      let response = await this._get(url.toString());
      return response.json().data.Results;
  }
}


/**
* A storage class that uses the Photoshelter API.
*/
export class PhotoshelterStorage extends AbstractFileStorage {
  constructor(email, password, apikey, rootId){
    super();

    this._photoshelterAPI = new PhotoshelterAPI(email, password, apikey);
  }

  async addDirectory(parentId, name) {
    return undefined;
  }

  async addFile(parentId, file, filename) {
    return undefined;
  }

  clone() {
    return undefined;
  }

  async copy(sourceId, targetParentId) {
    return undefined;
  }

  async delete(id) {
    return undefined;
  }

  async move(sourceId, targetParentId) {
    return undefined;
  }

  _dataToImageFileNode(data){
    let url;
    if (!data.hasOwnProperty('ImageLink')){
      url = this._photoshelterAPI.getImageLink(fileNode.id);
    } else {
      url = data.ImageLink.link;
    }
    let time = new Date().toISOString();
    return {
      id: data['image_id'],
      name: data['file_name'],
      directory: false,
      icon: null,
      url: url,
      size: data['file_size'],
      mimeType: 'application/octet-stream',
      created: time,
      lastModified: time
    }
  }

  _dataToCollectionFileNode(data){
    return {
      id: data['collection_id'],
      name: data['name'],
      directory: true,
      url: '',
      icon: null,
      size: 0,
      mimeType: 'application/json',
      lastModified: new Date(data['modified_at']),
      created: new Date(data['created_at']),
    }
  }

  _dataToGalleryFileNode(data){
    return {
      id: data['gallery_id'],
      name: data['name'],
      directory: true,
      url: '',
      icon: null,
      size: 0,
      mimeType: 'application/json',
      lastModified: new Date(data['modified_at']),
      created: new Date(data['created_at']),
    }
  }

  async readFileNode(id, params) {
    if (id.startsWith('I')){
      return await this._photoshelterAPI.getImageFile(id);
    }

    let nodes = {};
    let rootFileNode = await this.getRootFileNode();
    if (id === rootFileNode.id || id.startsWith('C')){
      let data = await this._photoshelterAPI.getCollectionChildren(id);
      let childCollections = data.Collection || [];
      let childGalleries = data.Gallery || [];
      for (let collection of childCollections){
        nodes[collection.name] = this._dataToCollectionFileNode(collection);
      }
      for (let gallery of childGalleries){
        nodes[gallery.name] = this._dataToGalleryFileNode(gallery);
      }
    } else if (id.startsWith('G')){
      let data = await this._photoshelterAPI.getGalleryChildren(id);
      for (let image of data){
        nodes[image['file_name']] = this._dataToImageFileNode(image);
      }
    }
    return new Blob([JSON.stringify(nodes)], {type: 'application/json'});
  }

  async rename(id, newName) {
    return undefined;
  }

  async getRootFileNode() {
    let rootCollectionData = this._photoshelterAPI.getCollectionData();
    return this._dataToCollectionFileNode(rootCollectionData);
  }

  async search(id, query) {
    return undefined;
  }

  async writeFileNode(id, data) {
    return undefined;
  }
}
