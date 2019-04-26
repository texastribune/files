var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as files from "./base";
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
    _getAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.authToken === null) {
                let url = PhotoshelterAPI.url;
                url.pathname = '/psapi/v3/mem/authenticate';
                url.searchParams.set('api_key', this.apiKey);
                let data = {
                    email: this.email,
                    password: this.password,
                    mode: 'token'
                };
                let response = yield fetch(url.toString(), {
                    body: JSON.stringify(data),
                    method: 'POST'
                });
                if (response.ok) {
                    let data = (yield response.json()).data;
                    this.authToken = data.token;
                    if (data.hasOwnProperty('org')) {
                        let url = PhotoshelterAPI.url;
                        url.pathname = `/psapi/v3/mem/organization/${data.org[0].id}/authenticate`;
                        let response = yield fetch(url.toString(), {
                            headers: yield this.getHeaders(),
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
        });
    }
    getHeaders() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Headers({
                'X-PS-Api-Key': this.apiKey,
                'X-PS-Auth-Token': yield this._getAuthToken()
            });
        });
    }
    get(url, retry) {
        return __awaiter(this, void 0, void 0, function* () {
            retry = retry === undefined ? true : retry;
            let response = yield fetch(url.toString(), {
                headers: yield this.getHeaders()
            });
            if (!response.ok) {
                if (retry) {
                    this.authToken = null;
                    return yield this.get(url, false);
                }
                else {
                    throw new Error("Photoshelter error: " + response.statusText);
                }
            }
            return response;
        });
    }
    post(url, body, retry) {
        return __awaiter(this, void 0, void 0, function* () {
            retry = retry === undefined ? true : retry;
            let headers = yield this.getHeaders();
            headers.append('Content-Type', 'application/json');
            let response = yield fetch(url.toString(), {
                headers: headers,
                body: body,
                method: 'POST'
            });
            if (!response.ok) {
                if (retry) {
                    this.authToken = null;
                    return yield this.post(url, body, false);
                }
                else {
                    throw new Error("Photoshelter error: " + response.statusText);
                }
            }
            return response;
        });
    }
    getImageFile(photoId) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/image/${photoId}/download`;
            url.searchParams.set('f_embed', '');
            let response = yield this.get(url.toString());
            return yield response.arrayBuffer();
        });
    }
    getImageData(photoId) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/image/${photoId}`;
            let response = yield this.get(url.toString());
            return (yield response.json()).data.image;
        });
    }
    getImageGalleries(galleryId) {
        return __awaiter(this, void 0, void 0, function* () {
            galleryId = galleryId || 'root';
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/image/${galleryId}/galleries`;
            url.searchParams.set('extend', JSON.stringify({ Gallery: {} }));
            let response = yield this.get(url.toString());
            return (yield response.json()).data.ImageGallery;
        });
    }
    getImageLink(photoId) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/image/${photoId}/link`;
            let response = yield this.get(url.toString());
            return (yield response.json()).data.ImageLink.link;
        });
    }
    getCollectionData(collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            collectionId = collectionId || 'root';
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/collection/${collectionId}`;
            let response = yield this.get(url.toString());
            return (yield response.json()).data.Collection;
        });
    }
    getCollectionParent(collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            collectionId = collectionId || 'root';
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/collection/${collectionId}/parent`;
            let response = yield this.get(url.toString());
            return (yield response.json()).data.Collection;
        });
    }
    getCollectionChildren(collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            collectionId = collectionId || 'root';
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/collection/${collectionId}/children`;
            url.searchParams.set('extend', JSON.stringify({ Collection: {}, Gallery: {} }));
            let response = yield this.get(url.toString());
            return (yield response.json()).data.Children;
        });
    }
    getGalleryData(galleryId) {
        return __awaiter(this, void 0, void 0, function* () {
            galleryId = galleryId || 'root';
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/gallery/${galleryId}`;
            let response = yield this.get(url.toString());
            return (yield response.json()).data.Gallery;
        });
    }
    getGalleryParent(galleryId) {
        return __awaiter(this, void 0, void 0, function* () {
            galleryId = galleryId || 'root';
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/gallery/${galleryId}/parent`;
            url.searchParams.set('extend', JSON.stringify({ Collection: {} }));
            let response = yield this.get(url.toString());
            return (yield response.json()).data.Parents;
        });
    }
    getGalleryChildren(galleryId) {
        return __awaiter(this, void 0, void 0, function* () {
            galleryId = galleryId || 'root';
            let url = PhotoshelterAPI.url;
            url.pathname = `/psapi/v3/mem/gallery/${galleryId}/children`;
            url.searchParams.set('extend', JSON.stringify({ Image: {}, ImageLink: {} }));
            let response = yield this.get(url.toString());
            return (yield response.json()).data.GalleryImage;
        });
    }
    search(string) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = PhotoshelterAPI.url;
            url.pathname = '/psapi/v3/mem/image/search';
            let terms = string.split(" ");
            url.searchParams.set('terms', JSON.stringify(terms));
            url.searchParams.set('extend', JSON.stringify({ Image: {}, ImageLink: {} }));
            let response = yield this.get(url.toString());
            return (yield response.json()).data.Results;
        });
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
    read() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.api.getImageFile(this.id);
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot write to photoshelter images");
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot rename to photoshelter images");
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot delete to photoshelter images");
        });
    }
    copy(targetDirectory) {
        const _super = Object.create(null, {
            copy: { get: () => super.copy }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.copy.call(this, targetDirectory);
        });
    }
    move(targetDirectory) {
        const _super = Object.create(null, {
            move: { get: () => super.move }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.move.call(this, targetDirectory);
        });
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
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot search photoshelter collection");
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot rename to photoshelter collections");
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot delete to photoshelter collections");
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot add to photoshelter collection");
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot add to photoshelter collection");
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            let data = yield this.api.getCollectionChildren(this.id);
            let childCollections = data.Collection || [];
            let childGalleries = data.Gallery || [];
            for (let collection of childCollections) {
                children.push(new PhotoshelterCollection(collection, this.api));
            }
            for (let gallery of childGalleries) {
                children.push(new PhotoshelterGallery(gallery, this.api));
            }
            return children;
        });
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
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot search to photoshelter gallery");
        });
    }
    rename(newName) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    addFile(fileData, filename, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot add to photoshelter gallery");
        });
    }
    addDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error("cannot add to photoshelter gallery");
        });
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            let children = [];
            for (let imageData of yield this.api.getGalleryChildren(this.id)) {
                children.push(new PhotoshelterImage(imageData, this.api));
            }
            return children;
        });
    }
}
