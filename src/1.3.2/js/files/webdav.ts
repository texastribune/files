import {createClient, Stat, ClientInterface} from "webdav";
import * as files from "./base";


class WebDavFile extends files.BasicFile {
    private readonly client : ClientInterface;
    private readonly stat : Stat;
    public readonly extra = {};

    constructor(client : ClientInterface, stat : Stat) {
        super();
        this.client = client;
        this.stat = stat;
    }

    get id() {
        return this.stat.filename;
    }

    get name() {
        return this.stat.basename;
    }

    get mimeType(){
        return this.stat.type;
    }

    get lastModified() {
        return new Date(this.stat.lastmod);
    }

    get created() {
        return new Date(this.stat.lastmod);
    }

    get url() {
        return this.client.getFileDownloadLink(this.stat.filename);
    }

    get icon() {
        return null;
    }

    get size() {
        return Number.parseInt(this.stat.size);
    }

    read() : Promise<ArrayBuffer> {
        return this.client.createReadStream(this.stat.filename);
    }

    async write(data : ArrayBuffer) : Promise<ArrayBuffer> {
        return this.client.createWriteStream(this.stat.filename);
    }

    async rename(newName : string) {

    }

    delete() {
        return this.client.deleteFile(this.stat.filename);
    }
}


class WebDavDirectory extends files.Directory {
    private readonly client : ClientInterface;
    private readonly stat : Stat;
    public readonly extra = {};

    constructor(client : ClientInterface, stat : Stat) {
        super();
        this.client = client;
        this.stat = stat;
    }

    get id() {
        return this.stat.filename;
    }

    get name() {
        return this.stat.basename;
    }

    get lastModified() {
        return new Date(this.stat.lastmod);
    }

    get created() {
        return new Date(this.stat.lastmod);
    }

    get url() {
        return null;
    }

    get icon() {
        return null;
    }

    get size() {
        return Number.parseInt(this.stat.size);
    }

    async rename(newName : string) : Promise<void> {

    }

    delete() : Promise<void> {
        return this.client.deleteFile(this.stat.filename);
    }


    async search(query: string) : Promise<files.SearchResult[]> {

    }

    async addFile(fileData: ArrayBuffer, filename: string, mimeType?: string) : Promise<WebDavFile> {
        let path = this.stat.filename + '/' + filename;
        await this.client.putFileContents(path, fileData);
        let stat = await this.client.stat(path);
        return new WebDavFile(this.client, stat);
    }

    async addDirectory(name : string) : Promise<WebDavDirectory> {
        let path = this.stat.filename + '/' + name;
        await this.client.createDirectory(path);
        let stat = await this.client.stat(path);
        return new WebDavDirectory(this.client, stat);
    }

    async getChildren() : Promise<files.File[]> {
        let stats = await this.client.getDirectoryContents(this.stat.filename);
        let files : files.File[] = [];
        for (let stat of stats){
            if (stat.type === 'directory'){
                files.push(new WebDavDirectory(this.client, stat));
            } else {
                files.push(new WebDavFile(this.client, stat));
            }
        }
        return files;
    }
}

export class WebDavRoot extends WebDavDirectory {
    constructor(url : string, path : string) {
        let client = createClient(url);
        super(client, {
            filename: path,
            basename: 'root',
            lastmod : new Date().toISOString(),
            size : "0",
            type : 'directory',
            etag : null,
        })
    }
}
