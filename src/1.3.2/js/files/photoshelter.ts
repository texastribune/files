import * as files from "./base";

interface ImageData {
    image_id: string;
    owner_id: string;
    organization_id: string;
    creator_id: string;
    photographer_id: string;
    file_name: string;
    file_size: number;
    height: number;
    width: number;
    screen_height: number;
    screen_width: number;
    screen_height_max: number;
    screen_width_max: number;
    thumb_height: number;
    thumb_width: number;
    stat_show: number;
    f_searchable: boolean;
    model_released: boolean;
    property_released: boolean;
    rating: number;
    flagged: boolean;
    focal_point_x: number;
    focal_point_y: number;
    updated_at: string;
    uploaded_at: string;
}

interface CollectionData {
    collection_id: string;
    name: string;
    description: string;
    f_list: boolean;
    display_order: number;
    mode: string;
    effective_mode: string;
    created_at: string;
    modified_at: string;
}

interface GalleryData {
    gallery_id: string;
    name: string;
    description: string;
    f_list: boolean;
    display_order: number;
    mode: string;
    effective_mode: string;
    created_at: string;
    modified_at: string;
}

interface CollectionChildren {
    Collection: CollectionData[] | null,
    Gallery: GalleryData[] | null;
}

export class PhotoshelterAPI {
    private readonly email : string;
    private readonly password : string;
    private readonly apiKey : string;
    private authToken : string | null;

    constructor(email : string, password : string, apikey : string){
        this.email = email;
        this.password = password;
        this.apiKey = apikey;
        this.authToken = null;
    }

    static get url(){
        return new URL('https://www.photoshelter.com');
    }

    async _getAuthToken() : Promise<string> {
        if (this.authToken === null){
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
            if (response.ok){
                let data = (await response.json()).data;
                this.authToken = data.token;
                if (data.hasOwnProperty('org')){
                    let url = PhotoshelterAPI.url;
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
        if (this.authToken === null){
            throw Error("Could not get auth token");
        }
        return this.authToken;
    }

    async getHeaders() : Promise<Headers> {
        return new Headers({
            'X-PS-Api-Key': this.apiKey,
            'X-PS-Auth-Token': await this._getAuthToken()
        });
    }

    private async get(url : string, retry? : boolean) : Promise<Response> {
        retry = retry === undefined ? true : retry;
        let response = await fetch(url.toString(), {
            headers: await this.getHeaders()
        });
        if (!response.ok){
            if (retry){
                this.authToken = null;
                return await this.get(url, false);
            } else {
                throw new Error("Photoshelter error: " + response.statusText);
            }
        }
        return response;
    }

    private async post(url : string, body : string, retry? : boolean) : Promise<Response> {
        retry = retry === undefined ? true : retry;
        let headers = await this.getHeaders();
        headers.append('Content-Type', 'application/json');
        let response = await fetch(url.toString(), {
            headers: headers,
            body: body,
            method: 'POST'
        });
        if (!response.ok){
            if (retry){
                this.authToken = null;
                return await this.post(url, body, false);
            } else {
                throw new Error("Photoshelter error: " + response.statusText);
            }
        }
        return response;
    }

    async getImageFile(photoId : string) : Promise<ArrayBuffer> {
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${photoId}/download`;
        url.searchParams.set('f_embed', '');
        let response = await this.get(url.toString());
        return await response.arrayBuffer();
    }

    async getImageData(photoId : string) : Promise<ImageData> {
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${photoId}`;
        let response = await this.get(url.toString());
        return (await response.json()).data.image;
    }

    async getImageGalleries(galleryId : string){
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${galleryId}/galleries`;
        url.searchParams.set('extend', JSON.stringify({Gallery: {}}));
        let response = await this.get(url.toString());
        return (await response.json()).data.ImageGallery;
    }

    async getImageLink(photoId : string){
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/image/${photoId}/link`;
        let response = await this.get(url.toString());
        return (await response.json()).data.ImageLink.link;
    }

    async getCollectionData(collectionId : string) : Promise<CollectionData> {
        collectionId = collectionId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/collection/${collectionId}`;
        let response = await this.get(url.toString());
        return (await response.json()).data.Collection;
    }

    async getCollectionParent(collectionId : string) : Promise<CollectionData> {
        collectionId = collectionId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/collection/${collectionId}/parent`;
        let response = await this.get(url.toString());
        return (await response.json()).data.Collection;
    }

    async getCollectionChildren(collectionId : string) : Promise<CollectionChildren> {
        collectionId = collectionId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/collection/${collectionId}/children`;
        url.searchParams.set('extend', JSON.stringify({Collection: {}, Gallery: {}}));
        let response = await this.get(url.toString());
        return (await response.json()).data.Children;
    }

    async getGalleryData(galleryId : string) : Promise<GalleryData> {
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/gallery/${galleryId}`;
        let response = await this.get(url.toString());
        return (await response.json()).data.Gallery;
    }

    async getGalleryParent(galleryId : string) : Promise<CollectionData> {
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/gallery/${galleryId}/parent`;
        url.searchParams.set('extend', JSON.stringify({Collection: {}}));
        let response = await this.get(url.toString());
        return (await response.json()).data.Parents;
    }

    async getGalleryChildren(galleryId : string) : Promise<ImageData[]> {
        galleryId = galleryId || 'root';
        let url = PhotoshelterAPI.url;
        url.pathname = `/psapi/v3/mem/gallery/${galleryId}/children`;
        url.searchParams.set('extend', JSON.stringify({Image: {}, ImageLink: {}}));
        let response = await this.get(url.toString());
        return (await response.json()).data.GalleryImage;
    }

    async search(string : string){
        let url = PhotoshelterAPI.url;
        url.pathname = '/psapi/v3/mem/image/search';
        let terms = string.split(" ");
        url.searchParams.set('terms', JSON.stringify(terms));
        url.searchParams.set('extend', JSON.stringify({Image: {}, ImageLink: {}}));
        let response = await this.get(url.toString());
        return (await response.json()).data.Results;
    }
}

export class PhotoshelterImage extends files.BasicFile {
    public readonly id : string;
    public readonly created: Date;
    public readonly lastModified: Date;
    public readonly mimeType: string;
    public readonly name: string;
    public readonly size: number;
    public readonly url = null;
    public readonly icon = null;
    public extra = {};

    private readonly api : PhotoshelterAPI;

    constructor(data : ImageData, api : PhotoshelterAPI) {
        super();
        this.id = data.image_id;
        this.name = data.file_name;
        this.created = new Date(data.uploaded_at);
        this.lastModified = new Date(data.updated_at);
        this.size = data.file_size;
        this.mimeType = 'application/octet-stream';

        this.api = api;
    }

    async read(params?: Object): Promise<ArrayBuffer> {
        return await this.api.getImageFile(this.id);
    }

    async write(data: ArrayBuffer): Promise<ArrayBuffer> {
        throw Error("cannot write to photoshelter images");
    }

    async rename(newName: string): Promise<void> {
        throw Error("cannot rename to photoshelter images");
    }

    async delete(): Promise<void> {
        throw Error("cannot delete to photoshelter images");
    }

    async copy(targetDirectory: files.Directory): Promise<void> {
        super.copy(targetDirectory);
    }

    async move(targetDirectory: files.Directory): Promise<void> {
        super.move(targetDirectory);
    }
}

export class PhotoshelterCollection extends files.Directory {
    public readonly id : string;
    public readonly created: Date;
    public readonly lastModified: Date;
    public readonly name: string;
    public readonly size: number;
    public readonly icon = null;
    public extra = {};

    private readonly api : PhotoshelterAPI;

    constructor(data : CollectionData, api : PhotoshelterAPI) {
        super();
        this.id = data.collection_id;
        this.name = data.name;
        this.created = new Date(data.created_at);
        this.lastModified = new Date(data.modified_at);
        this.size = 0;

        this.api = api;
    }

    async search(query: string): Promise<files.SearchResult[]> {
        throw Error("cannot search photoshelter collection");
    }

    async rename(newName: string): Promise<void> {
        throw Error("cannot rename to photoshelter collections");
    }

    async delete(): Promise<void> {
        throw Error("cannot delete to photoshelter collections");
    }

    async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File> {
        throw Error("cannot add to photoshelter collection");
    }

    async addDirectory(name: string): Promise<files.Directory> {
        throw Error("cannot add to photoshelter collection");
    }

    async getChildren() : Promise<files.File[]> {
        let children = [];
        let data = await this.api.getCollectionChildren(this.id);
        let childCollections = data.Collection || [];
        let childGalleries = data.Gallery || [];
        for (let collection of childCollections){
            children.push(new PhotoshelterCollection(collection, this.api));
        }
        for (let gallery of childGalleries){
            children.push(new PhotoshelterGallery(gallery, this.api));
        }
        return children;
    }
}

export class PhotoshelterGallery extends files.Directory {
    public readonly id : string;
    public readonly created: Date;
    public readonly lastModified: Date;
    public readonly name: string;
    public readonly size: number;
    public readonly icon = null;
    public extra = {};

    private readonly api : PhotoshelterAPI;

    constructor(data : GalleryData, api : PhotoshelterAPI) {
        super();
        this.id = data.gallery_id;
        this.name = data.name;
        this.created = new Date(data.created_at);
        this.lastModified = new Date(data.modified_at);
        this.size = 0;

        this.api = api;
    }

    async search(query: string): Promise<files.SearchResult[]> {
        throw Error("cannot search to photoshelter gallery");
    }

    async rename(newName: string): Promise<void> {
        return undefined;
    }

    async delete(): Promise<void> {
        return undefined;
    }

    async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File> {
        throw Error("cannot add to photoshelter gallery");
    }

    async addDirectory(name: string): Promise<files.Directory> {
        throw Error("cannot add to photoshelter gallery");
    }

    async getChildren() : Promise<files.File[]> {
        let children = [];
        for (let imageData of await this.api.getGalleryChildren(this.id)){
            children.push(new PhotoshelterImage(imageData, this.api));
        }
        return children;
    }
}