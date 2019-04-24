import {FileAPIFileStorage} from "./js/files/storages/remote.js";
import {MemoryFileStorage} from "./js/files/storages/memory.js";
import {LocalStorageFileStorage} from "./js/files/storages/local.js";
import {FileSystem} from "./js/files/systems.js";

import * as browserModule from './js/ui/browser.js';
import * as configModule from './js/ui/config.js';
import * as dialogModule from './js/ui/dialog.js';
import * as messageModule from './js/ui/messages.js';
import * as tableModule from './js/ui/table.js';
import * as utilsModule from './js/utils.js';

import alert from './js/bin/alert.js';
import archive from './js/bin/archive.js';
import browser from './js/bin/browser.js';
import cd from './js/bin/cd.js';
import find from './js/bin/find.js';
import ls from './js/bin/ls.js';
import terminal from './js/bin/terminal.js';
import mount from './js/bin/mount.js';
import mountFileAPI from './js/bin/mount.fileapi.js';
import mountPhotoshelter from './js/bin/mount.photoshelter.js';


let rootStorage = new LocalStorageFileStorage();
let fileSystem = new FileSystem(rootStorage);

fileSystem._binFuncs = {};
let binStorage = new MemoryFileStorage();

function addBinExecutable(name, func){
  // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
  fileSystem._binFuncs[name] = func;
  let text = `let main = async (...args) => {return await this._binFuncs["${name}"].bind(this)(...args);}`;
  let filename = `${name}.js`;
  let file = new File([text], filename, {type: 'application/javascript'});
  binStorage.addFile(binStorage.rootFileNode, file, filename);
}

addBinExecutable('alert', alert);
addBinExecutable('archive', archive);
addBinExecutable('browser', browser);
addBinExecutable('cd', cd);
addBinExecutable('find', find);
addBinExecutable('ls', ls);
addBinExecutable('terminal', terminal);
addBinExecutable('mount', mount);
addBinExecutable('mount.fileapi', mountFileAPI);
addBinExecutable('mount.photoshelter', mountPhotoshelter);

fileSystem.mount(fileSystem.rootFileObject, binStorage, 'bin');


fileSystem._modules = {};
let apiStorage = new MemoryFileStorage();

function addApiModule(name, module){
  // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
  fileSystem._modules[name] = module;
  let text = '';
  for (let variableName in module){
    text += `let ${variableName} = this._modules["${name}"]["${variableName}"];`
  }
  let filename = `${name}.js`;
  apiStorage.addFile(apiStorage.rootFileNode, new File([text], filename, {type: 'application/javascript'}), filename);
}

addApiModule('browser', browserModule);
addApiModule('config', configModule);
addApiModule('dialog', dialogModule);
addApiModule('messages', messageModule);
addApiModule('table', tableModule);
addApiModule('storage', {
  local: LocalStorageFileStorage,
  memory: MemoryFileStorage,
  remote: FileAPIFileStorage
});
addApiModule('utils', utilsModule);

fileSystem.mount(fileSystem.rootFileObject, apiStorage, 'api');

export {FileSystem, fileSystem};

export default fileSystem;
