import {BasicFile} from "../base.ts";


export class NullFile extends BasicFile {
  constructor() {
    super();
    this._created = new Date();
    this._lastModified = new Date();
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

  get lastModified(){
    return this._lastModified;
  }

  get created(){
    return this._created;
  }

  async read(params){
    return new ArrayBuffer(0);
  }

  async write(data){
    return data;
  }

  async delete() {
    this._parent.removeChild(this);
  }

  async rename(newName){
    this._name = newName;
  }
}