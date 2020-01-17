import * as files from "./base.js";
export class PhotoshelterAPI {
    constructor(email, password, apikey) {
        this.email = email;
        this.password = password;
        this.apiKey = apikey;
        this.authToken = null;
    }
    static get url() {
        return new URL('https://www.photoshelter.com');
    }
    async _getAuthToken() {
        if (this.authToken === null) {
            let url = PhotoshelterAPI.url;
            url.pathname = '/psapi/v3/mem/authenticate';
            url.searchParams.set('api_key', this.apiKey);
            let data = {
                email: this.email,
                password: this.password,
                mode: 'token'
            };
            let response = await fetch(url.toString(), {
                body: JSON.stringify(data),
                method: 'POST'
            });
            if (response.ok) {
                let data = (await response.json()).data;
                this.authToken = data.token;
                if (data.hasOwnProperty('org')) {
                    let url = PhotoshelterAPI.url;
                    url.pathname = `/psapi/v3/mem/organization/${data.org[0].id}/authenticate`;
                    let response = await fetch(url.toString(), {
                        headers: await this.getHeaders(),
                        method: 'POST'
                    });
                    if (!response.ok) {
                        throw Error("Error authentication Photoshelter organization");
                    }
                }
            }
            else {
                throw Error("Error authentication Photoshelter");
            }
        }
        if (this.authToken === null) {
            throw Error("Could not get auth token");
        }
        return this.authToken;
    }
    async getHeaders() {
        return new Headers({
            'X-PS-Api-Key': this.apiKey,
            'X-PS-Auth-Token': await this._getAuthToken()
        });
    }
    async get(url, retry) {
        retry = retry === undefined ? true : retry;
        let response = await fetch(url.toString(), {
            headers: await this.getHeaders()
        });
        if (!response.ok) {
            if (retry) {
                this.authToken = null;
                return await this.get(url, false);
            }
            else {
                throw new Error("Photoshelter error: " + response.statusText);
            }
        }
        return response;
    }
    async post(url, body, retry) {
        retry = retry === undefined ? true : retry;
        let headers = await this.getHeaders();
        headers.append('Content-Type', 'application/json');
        let response = await fetch(url.toString(), {
            headers: headers,
            body: body,
            method: 'POST'
        });
        if (!response.ok) {
            if (retry) {
                this.authToken = null;
                return await this.post(url, body, false);
            }
            else {
                throw new Error("Photoshelter error: " + response.statusText);
            }
        }
        return response;
    }
    async getImageFile(photoId) {
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${photoId}/download`;
        url.searchParams.set('f_embed', '');
        let response = await this.get(url.toString());
        return await response.arrayBuffer();
    }
    async getImageData(photoId) {
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${photoId}`;
        let response = await this.get(url.toString());
        return (await response.json()).data.image;
    }
    async getImageGalleries(galleryId) {
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${galleryId}/galleries`;
        url.searchParams.set('extend', JSON.stringify({ Gallery: {} }));
        let response = await this.get(url.toString());
        return (await response.json()).data.ImageGallery;
    }
    async getImageLink(photoId) {
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${photoId}/link`;
        let response = await this.get(url.toString());
        return (await response.json()).data.ImageLink.link;
    }
    async getCollectionData(collectionId) {
        collectionId = collectionId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/collection/${collectionId}`;
        let response = await this.get(url.toString());
        return (await response.json()).data.Collection;
    }
    async getCollectionParent(collectionId) {
        collectionId = collectionId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/collection/${collectionId}/parent`;
        let response = await this.get(url.toString());
        return (await response.json()).data.Collection;
    }
    async getCollectionChildren(collectionId) {
        collectionId = collectionId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/collection/${collectionId}/children`;
        url.searchParams.set('extend', JSON.stringify({ Collection: {}, Gallery: {} }));
        let response = await this.get(url.toString());
        return (await response.json()).data.Children;
    }
    async getGalleryData(galleryId) {
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/gallery/${galleryId}`;
        let response = await this.get(url.toString());
        return (await response.json()).data.Gallery;
    }
    async getGalleryParent(galleryId) {
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/gallery/${galleryId}/parent`;
        url.searchParams.set('extend', JSON.stringify({ Collection: {} }));
        let response = await this.get(url.toString());
        return (await response.json()).data.Parents;
    }
    async getGalleryChildren(galleryId) {
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/gallery/${galleryId}/children`;
        url.searchParams.set('extend', JSON.stringify({ Image: {}, ImageLink: {} }));
        let response = await this.get(url.toString());
        return (await response.json()).data.GalleryImage;
    }
    async search(string) {
        let url = PhotoshelterAPI.url;
        url.pathname = '/psapi/v3/mem/image/search';
        let terms = string.split(" ");
        url.searchParams.set('terms', JSON.stringify(terms));
        url.searchParams.set('extend', JSON.stringify({ Image: {}, ImageLink: {} }));
        let response = await this.get(url.toString());
        return (await response.json()).data.Results;
    }
}
export class PhotoshelterImage extends files.BasicFile {
    constructor(data, api) {
        super();
        this.url = null;
        this.icon = null;
        this.extra = {};
        this.id = data.image_id;
        this.name = data.file_name;
        this.created = new Date(data.uploaded_at);
        this.lastModified = new Date(data.updated_at);
        this.size = data.file_size;
        this.mimeType = 'application/octet-stream';
        this.api = api;
    }
    async read() {
        return await this.api.getImageFile(this.id);
    }
    async write(data) {
        throw Error("cannot write to photoshelter images");
    }
    async rename(newName) {
        throw Error("cannot rename to photoshelter images");
    }
    async delete() {
        throw Error("cannot delete to photoshelter images");
    }
    async copy(targetDirectory) {
        super.copy(targetDirectory);
    }
    async move(targetDirectory) {
        super.move(targetDirectory);
    }
}
export class PhotoshelterCollection extends files.Directory {
    constructor(data, api) {
        super();
        this.icon = null;
        this.extra = {};
        this.id = data.collection_id;
        this.name = data.name;
        this.created = new Date(data.created_at);
        this.lastModified = new Date(data.modified_at);
        this.size = 0;
        this.api = api;
    }
    async search(query) {
        throw Error("cannot search photoshelter collection");
    }
    async rename(newName) {
        throw Error("cannot rename to photoshelter collections");
    }
    async delete() {
        throw Error("cannot delete to photoshelter collections");
    }
    async addFile(fileData, filename, mimeType) {
        throw Error("cannot add to photoshelter collection");
    }
    async addDirectory(name) {
        throw Error("cannot add to photoshelter collection");
    }
    async getChildren() {
        let children = [];
        let data = await this.api.getCollectionChildren(this.id);
        let childCollections = data.Collection || [];
        let childGalleries = data.Gallery || [];
        for (let collection of childCollections) {
            children.push(new PhotoshelterCollection(collection, this.api));
        }
        for (let gallery of childGalleries) {
            children.push(new PhotoshelterGallery(gallery, this.api));
        }
        return children;
    }
}
export class PhotoshelterGallery extends files.Directory {
    constructor(data, api) {
        super();
        this.icon = null;
        this.extra = {};
        this.id = data.gallery_id;
        this.name = data.name;
        this.created = new Date(data.created_at);
        this.lastModified = new Date(data.modified_at);
        this.size = 0;
        this.api = api;
    }
    async search(query) {
        throw Error("cannot search to photoshelter gallery");
    }
    async rename(newName) {
        return undefined;
    }
    async delete() {
        return undefined;
    }
    async addFile(fileData, filename, mimeType) {
        throw Error("cannot add to photoshelter gallery");
    }
    async addDirectory(name) {
        throw Error("cannot add to photoshelter gallery");
    }
    async getChildren() {
        let children = [];
        for (let imageData of await this.api.getGalleryChildren(this.id)) {
            children.push(new PhotoshelterImage(imageData, this.api));
        }
        return children;
    }
}
