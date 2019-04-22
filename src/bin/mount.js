import {getOpt} from "../utils.js";


export default async function main(...args) {
  let ret = getOpt(...args);
  args = ret[0];
  let kwargs = ret[1];
  if (!kwargs.type){
    kwargs.type = 'fileapi';
  }
  return await this.exec(`mount.${kwargs.type}`, ...args);
}
