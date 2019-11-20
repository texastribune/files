import { DirectoryElement } from "./files.js";
import { S3Directory, S3Bucket } from "../files/s3.js";
/**
 * Create a directory from an AWS s3 bucket or folder within a bucket. At a minimum the bucket parameter must be set,
 * for example <s3-directory bucket="bucket-name"><s3-directory>. If you to want to start from a specific folder, use
 * the prefix attribute. The delimiter attribute defaults to "/", but can be overriden. If your bucket is at a custom
 * domain, set the url attribute to that url. To limit the number of items shown, set the optional "max-keys" attribute.
 */
export class S3DirectoryElement extends DirectoryElement {
    constructor() {
        super();
        this.directory = new S3Directory(this.prefix, new S3Bucket({
            name: this.bucketName,
            delimiter: this.delimiter,
            customUrl: this.url,
        }), this.maxKeys);
    }
    static get observedAttributes() {
        return [S3DirectoryElement.bucketNameAttribute, S3DirectoryElement.prefixAttribute,
            S3DirectoryElement.delimiterAttribute, S3DirectoryElement.urlAttribute, S3DirectoryElement.maxKeysAttribute,];
    }
    get prefix() {
        return this.getAttribute(S3DirectoryElement.prefixAttribute) || "";
    }
    set prefix(value) {
        this.setAttribute(S3DirectoryElement.prefixAttribute, value);
    }
    get bucketName() {
        return this.getAttribute(S3DirectoryElement.bucketNameAttribute) || "";
    }
    set bucketName(value) {
        this.setAttribute(S3DirectoryElement.bucketNameAttribute, value);
    }
    get delimiter() {
        return this.getAttribute(S3DirectoryElement.delimiterAttribute) || "/";
    }
    set delimiter(value) {
        this.setAttribute(S3DirectoryElement.delimiterAttribute, value);
    }
    get url() {
        return this.getAttribute(S3DirectoryElement.urlAttribute);
    }
    set url(value) {
        if (value == null) {
            this.removeAttribute(S3DirectoryElement.urlAttribute);
        }
        else {
            this.setAttribute(S3DirectoryElement.urlAttribute, value);
        }
    }
    get maxKeys() {
        let attr = this.getAttribute(S3DirectoryElement.maxKeysAttribute);
        if (attr == null) {
            return null;
        }
        return Number.parseInt(attr);
    }
    set maxKeys(value) {
        if (value === null) {
            this.removeAttribute(S3DirectoryElement.maxKeysAttribute);
        }
        else {
            this.setAttribute(S3DirectoryElement.maxKeysAttribute, value.toString());
        }
    }
    updateFromAttributes(attributes) {
        this.directory = new S3Directory(this.prefix, new S3Bucket({
            name: this.bucketName,
            delimiter: this.delimiter,
            customUrl: this.url,
        }), this.maxKeys);
    }
}
S3DirectoryElement.bucketNameAttribute = 'bucket';
S3DirectoryElement.prefixAttribute = 'prefix';
S3DirectoryElement.delimiterAttribute = 'delimiter';
S3DirectoryElement.urlAttribute = 'url';
S3DirectoryElement.maxKeysAttribute = 'max-keys';
customElements.define('s3-directory', S3DirectoryElement);
