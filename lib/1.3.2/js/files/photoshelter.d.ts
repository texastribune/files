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
    Collection: CollectionData[] | null;
    Gallery: GalleryData[] | null;
}
export declare class PhotoshelterAPI {
    private readonly email;
    private readonly password;
    private readonly apiKey;
    private authToken;
    constructor(email: string, password: string, apikey: string);
    static readonly url: URL;
    _getAuthToken(): Promise<string>;
    getHeaders(): Promise<Headers>;
    private get;
    private post;
    getImageFile(photoId: string): Promise<ArrayBuffer>;
    getImageData(photoId: string): Promise<ImageData>;
    getImageGalleries(galleryId: string): Promise<any>;
    getImageLink(photoId: string): Promise<any>;
    getCollectionData(collectionId: string): Promise<CollectionData>;
    getCollectionParent(collectionId: string): Promise<CollectionData>;
    getCollectionChildren(collectionId: string): Promise<CollectionChildren>;
    getGalleryData(galleryId: string): Promise<GalleryData>;
    getGalleryParent(galleryId: string): Promise<CollectionData>;
    getGalleryChildren(galleryId: string): Promise<ImageData[]>;
    search(string: string): Promise<any>;
}
export declare class PhotoshelterImage extends files.BasicFile {
    readonly id: string;
    readonly created: Date;
    readonly lastModified: Date;
    readonly mimeType: string;
    readonly name: string;
    readonly size: number;
    readonly url: null;
    readonly icon: null;
    extra: {};
    private readonly api;
    constructor(data: ImageData, api: PhotoshelterAPI);
    read(params?: Object): Promise<ArrayBuffer>;
    write(data: ArrayBuffer): Promise<ArrayBuffer>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    copy(targetDirectory: files.Directory): Promise<void>;
    move(targetDirectory: files.Directory): Promise<void>;
}
export declare class PhotoshelterCollection extends files.Directory {
    readonly id: string;
    readonly created: Date;
    readonly lastModified: Date;
    readonly name: string;
    readonly size: number;
    readonly icon: null;
    extra: {};
    private readonly api;
    constructor(data: CollectionData, api: PhotoshelterAPI);
    search(query: string): Promise<files.File[]>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getChildren(): Promise<files.File[]>;
}
export declare class PhotoshelterGallery extends files.Directory {
    readonly id: string;
    readonly created: Date;
    readonly lastModified: Date;
    readonly name: string;
    readonly size: number;
    readonly icon: null;
    extra: {};
    private readonly api;
    constructor(data: GalleryData, api: PhotoshelterAPI);
    search(query: string): Promise<files.File[]>;
    rename(newName: string): Promise<void>;
    delete(): Promise<void>;
    addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File>;
    addDirectory(name: string): Promise<files.Directory>;
    getChildren(): Promise<files.File[]>;
}
export {};
