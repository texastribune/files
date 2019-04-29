import {BasicFile} from "../files/base.js";


export class NullFile extends BasicFile {
  readonly created = new Date();
  readonly lastModified = new Date();
  readonly extra = {};

  constructor() {
    super();
  }

  get id(){
    return 'null';
  }

  get name(){
    return 'null';
  }

  get icon(){
    return null;
  }

  get url(){
    return null;
  }

  get mimeType(){
    return 'text/plain';
  }

  get size(){
    return 0;
  }

  async read() : Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async write(data : ArrayBuffer){
    return data;
  }

  async delete() {

  }

  async rename(newName : string){
    throw new Error("can't rename null file");
  }
}