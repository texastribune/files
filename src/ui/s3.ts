import {DirectoryElement} from "./files.js";
import {S3Directory, S3Bucket} from "../files/s3.js";


/**
 * Create a directory from an AWS s3 bucket or folder within a bucket. At a minimum the bucket parameter must be set,
 * for example <s3-directory bucket="bucket-name"><s3-directory>. If you to want to start from a specific folder, use
 * the prefix attribute. The delimiter attribute defaults to "/", but can be overriden. If your bucket is at a custom
 * domain, set the url attribute to that url. To limit the number of items shown, set the optional "max-keys" attribute.
 */
export class S3DirectoryElement extends DirectoryElement {
  public directory : S3Directory;

  static bucketNameAttribute : string = 'bucket';
  static prefixAttribute : string = 'prefix';
  static delimiterAttribute : string = 'delimiter';
  static urlAttribute : string = 'url';
  static maxKeysAttribute : string = 'max-keys';

  constructor(){
    super();

    this.directory = new S3Directory(
      this.prefix,
      new S3Bucket({
        name: this.bucketName,
        delimiter: this.delimiter,
        customUrl: this.url,
      }),
      this.maxKeys,
    );
  }

  static get observedAttributes() {
    return [S3DirectoryElement.bucketNameAttribute, S3DirectoryElement.prefixAttribute,
      S3DirectoryElement.delimiterAttribute, S3DirectoryElement.urlAttribute, S3DirectoryElement.maxKeysAttribute,];
  }

  get prefix() : string {
    return this.getAttribute(S3DirectoryElement.prefixAttribute) || "";
  }

  set prefix(value : string){
    this.setAttribute(S3DirectoryElement.prefixAttribute, value);
  }

  get bucketName() : string {
    return this.getAttribute(S3DirectoryElement.bucketNameAttribute) || "";
  }

  set bucketName(value : string){
    this.setAttribute(S3DirectoryElement.bucketNameAttribute, value);
  }

  get delimiter() : string {
    return this.getAttribute(S3DirectoryElement.delimiterAttribute) || "/";
  }

  set delimiter(value : string){
    this.setAttribute(S3DirectoryElement.delimiterAttribute, value);
  }

  get url() : string | null {
    return this.getAttribute(S3DirectoryElement.urlAttribute);
  }

  set url(value : string | null){
    if (value == null) {
      this.removeAttribute(S3DirectoryElement.urlAttribute);
    } else {
      this.setAttribute(S3DirectoryElement.urlAttribute, value);
    }
  }

  get maxKeys() : number | null {
    let attr = this.getAttribute(S3DirectoryElement.maxKeysAttribute);
    if (attr == null){
      return null;
    }
    return Number.parseInt(attr);
  }

  set maxKeys(value : number | null){
    if (value === null){
      this.removeAttribute(S3DirectoryElement.maxKeysAttribute);
    } else {
      this.setAttribute(S3DirectoryElement.maxKeysAttribute, value.toString());
    }
  }

  updateFromAttributes(attributes: { [p: string]: string | null }): void {
    this.directory = new S3Directory(
      this.prefix,
      new S3Bucket({
        name: this.bucketName,
        delimiter: this.delimiter,
        customUrl: this.url,
      }),
      this.maxKeys,
    );
  }
}


customElements.define('s3-directory', S3DirectoryElement);