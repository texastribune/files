declare module 'webdav' {
    import {Readable, Writable} from "stream";

    interface Stat {
        filename : string,
        basename : string,
        lastmod : string,
        size : string,
        type : string,
        mime? : string,
        etag : string | null,
        props? : Object,
    }

    interface ClientInterface {
        copyFile(remotePath : string, targetRemotePath : string, options? : Object) : Promise<void>
        createDirectory(dirPath : string, options? : Object) : Promise<void>
        createReadStream(remoteFilename : string, options? : Object) : Readable
        createWriteStream(remoteFilename : string, options? : Object) : Writable
        deleteFile(remotePath : string, options? : Object) : Promise<void>
        getDirectoryContents(path : string, options? : Object) : Promise<Stat[]>
        getFileContents(remoteFilename : string, options? : Object) : Promise<Buffer | string>
        getFileDownloadLink(remoteFilename : string, options? : Object) : string
        getFileUploadLink(remoteFilename : string, options? : Object) : string
        getQuota(options? : Object) : Promise<Object | null>
        moveFile(remotePath : string, targetRemotePath : string, options? : Object) : Promise<void>
        putFileContents(remoteFilename : string, data : string | Buffer, options? : Object) : Promise<void>
        stat(remotePath : string, options? : Object) : Promise<Stat>
    }

    export function createClient(remoteURL : string, options? : Object) : ClientInterface;
}