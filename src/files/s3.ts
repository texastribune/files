import * as files from "./base.js";
import {FileNotFoundError, SearchResult} from "./base.js";
import {ajax} from "../utils.js";


interface S3ObjectData {
  Key : string;
  LastModified : string;
  Size : number;
  ETag : string;
  StorageClass : string;
}

interface S3BucketData {
  name : string;
  delimiter : string;
  customUrl: string | null;
}

export class S3Bucket {
  private readonly data : S3BucketData;

  constructor(data : S3BucketData) {
    this.data = data;
  }

  get name() : string {
    return this.data.name;
  }

  get delimiter() : string {
    return this.data.delimiter;
  }

  get url() : URL {
    let url;
    if (this.data.customUrl){
      url = this.data.customUrl;
      if (url[url.length-1] != "/") {
        this.data.customUrl += "/";
      }
    } else {
      url = `https://s3.amazonaws.com/${this.data.name}/`;
    }
    return new URL(url, window.location.href);
  }
}


export class S3File extends files.BasicFile {
  private readonly bucket : S3Bucket;

  readonly created: Date;
  readonly extra: Object;
  readonly icon: string | null;
  readonly id: string;
  readonly lastModified: Date;
  readonly mimeType: string;
  readonly size: number;

  constructor(metadata : S3ObjectData, bucket : S3Bucket) {
    super();

    this.id = metadata.Key;
    let time = new Date(metadata.LastModified);
    this.created = time;
    this.lastModified = time;
    this.extra = {
      storageClass: metadata.StorageClass,
    };
    this.icon = null;
    this.mimeType = 'application/octet-stream';
    this.size = metadata.Size;

    this.bucket = bucket;
  }

  get name() : string {
    let path = this.id.split(this.bucket.delimiter);
    return path[path.length-1];
  }

  private get urlObject() {
    return new URL(this.id, this.bucket.url);
  }

  get url() {
    return this.urlObject.toString();
  }

  delete(): Promise<void> {
    throw new Error("not implemented");
  }

  read(): Promise<ArrayBuffer> {
    return ajax(this.urlObject, {}, null, 'GET');
  }

  rename(newName: string): Promise<void> {
    throw new Error("not implemented");
  }

  write(data: ArrayBuffer): Promise<ArrayBuffer> {
    throw new Error("not implemented");
  }
}

export class S3Directory extends files.Directory {
  private readonly bucket : S3Bucket;
  private readonly maxKeys : number | null;

  readonly created: Date;
  readonly extra: Object;
  readonly icon: string | null;
  readonly id: string;
  readonly lastModified: Date;

  constructor(prefix : string, bucket : S3Bucket, maxKeys : number | null) {
    super();

    this.id = prefix;
    let time = new Date();
    this.created = time;
    this.lastModified = time;
    this.icon = null;
    this.extra = {};

    this.bucket = bucket;
    this.maxKeys = maxKeys;
  }

  get name() : string {
    if (this.id == "") {
      return this.bucket.name;
    }

    let prefix = this.id;
    if (prefix[prefix.length-1] == this.bucket.delimiter) {
      prefix = prefix.slice(0, prefix.length-1);
    }
    let path = prefix.split(this.bucket.delimiter);
    return path[path.length-1];
  }

  addDirectory(name: string): Promise<files.Directory> {
    throw new Error("not implemented");
  }

  addFile(fileData: ArrayBuffer, filename: string, mimeType?: string): Promise<files.File> {
    throw new Error("not implemented");
  }

  delete(): Promise<void> {
    throw new Error("not implemented");
  }

  private async getFilesForPrefix(prefix : string): Promise<files.File[]> {
    let url = this.bucket.url;
    url.searchParams.append('prefix', prefix);
    url.searchParams.append('encoding-type', 'url');
    url.searchParams.append('delimiter', this.bucket.delimiter);
    url.searchParams.append('list-type', '2');
    if (this.maxKeys !== null){
      url.searchParams.append('max-keys', this.maxKeys.toString());
    }
    let response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("bad response " + response.statusText);
    }

    let files : files.File[] = [];

    let text = await response.text();
    let doc = new DOMParser().parseFromString(text,"text/xml");
    let contentElements = doc.querySelectorAll('Contents');
    let prefixElements = doc.querySelectorAll('CommonPrefixes');
    for (let prefixElement of prefixElements) {
      let prefix = prefixElement.querySelector('Prefix');
      if (prefix != null) {
        files.push(new S3Directory(prefix.innerHTML, this.bucket, this.maxKeys));
      }
    }
    for (let contentElement of contentElements) {
      let fileData : {[key : string] : string} = {};
      for (let dataElement of contentElement.children) {
        fileData[dataElement.tagName] = dataElement.innerHTML;
      }
      let s3ObjectData : S3ObjectData = {
        Key: fileData['Key'],
        LastModified: fileData['LastModified'],
        Size: Number.parseInt(fileData['Size']),
        ETag: fileData['ETag'],
        StorageClass: fileData['StorageClass'],
      };
      files.push(new S3File(s3ObjectData, this.bucket))
    }
    return files
  }

  async getFile(pathArray: string[]): Promise<files.File> {
    let prefix = this.id + pathArray.join(this.bucket.delimiter);
    let files = await this.getFilesForPrefix(prefix);
    if (files.length === 1 && files[0].id == prefix + this.bucket.delimiter){
      return files[0];
    }
    throw new FileNotFoundError(`no files found on S3 for prefix ${prefix}`);
  }

  async getChildren(): Promise<files.File[]> {
    return this.getFilesForPrefix(this.id)
  }

  rename(newName: string): Promise<void> {
    throw new Error("not implemented");
  }

  async search(query: string): Promise<SearchResult[]> {
    let results : SearchResult[] = [];
    let files = await this.getFilesForPrefix(this.id + query);
    for (let file of files){
      let pathString = file.id;
      if (this.id == pathString.slice(0, this.id.length)){
        pathString = pathString.slice(this.id.length, pathString.length);
      }
      let path = pathString.split(this.bucket.delimiter);
      if (path[path.length-1] == "") {
        path = path.slice(0, path.length-1);
      }
      results.push({
        file: file,
        path: path,
      })
    }
    return results;
  }
}