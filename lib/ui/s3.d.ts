import { DirectoryElement } from "./files.js";
import { S3Directory } from "../files/s3.js";
/**
 * Create a directory from an AWS s3 bucket or folder within a bucket. At a minimum the bucket parameter must be set,
 * for example <s3-directory bucket="bucket-name"><s3-directory>. If you to want to start from a specific folder, use
 * the prefix attribute. The delimiter attribute defaults to "/", but can be overriden. If your bucket is at a custom
 * domain, set the url attribute to that url. To limit the number of items shown, set the optional "max-keys" attribute.
 */
export declare class S3DirectoryElement extends DirectoryElement {
    directory: S3Directory;
    static bucketNameAttribute: string;
    static prefixAttribute: string;
    static delimiterAttribute: string;
    static urlAttribute: string;
    static maxKeysAttribute: string;
    constructor();
    static get observedAttributes(): string[];
    get prefix(): string;
    set prefix(value: string);
    get bucketName(): string;
    set bucketName(value: string);
    get delimiter(): string;
    set delimiter(value: string);
    get url(): string | null;
    set url(value: string | null);
    get maxKeys(): number | null;
    set maxKeys(value: number | null);
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
}
