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

async function setupFileSystem(){
  let rootStorage = new LocalStorageFileStorage();
  let fileSystem = new FileSystem(rootStorage);

  fileSystem._binFuncs = {};
  let binStorage = new MemoryFileStorage();
  let binStorageRootFileNode =  await binStorage.getRootFileNode();

  async function addBinExecutable(name, func){
    // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
    fileSystem._binFuncs[name] = func;
    let text = `let main = async (...args) => {return await this._binFuncs["${name}"].bind(this)(...args);}`;
    let filename = `${name}.js`;
    await binStorage.addFile(binStorageRootFileNode.id, utilsModule.stringToArrayBuffer(text),
                       filename, 'application/javascript');
  }

  await addBinExecutable('alert', alert);
  await addBinExecutable('archive', archive);
  await addBinExecutable('browser', browser);
  await addBinExecutable('cd', cd);
  await addBinExecutable('find', find);
  await addBinExecutable('ls', ls);
  await addBinExecutable('terminal', terminal);
  await addBinExecutable('mount', mount);
  await addBinExecutable('mount.fileapi', mountFileAPI);
  await addBinExecutable('mount.photoshelter', mountPhotoshelter);

  await fileSystem.mount([], binStorage, 'bin');


  fileSystem._modules = {};
  let apiStorage = new MemoryFileStorage();
  let apiStorageRootFileNode =  await apiStorage.getRootFileNode();

  async function addApiModule(name, module){
    // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
    fileSystem._modules[name] = module;
    let text = '';
    for (let variableName in module){
      text += `let ${variableName} = this._modules["${name}"]["${variableName}"];`
    }
    let filename = `${name}.js`;
    await apiStorage.addFile(apiStorageRootFileNode.id, utilsModule.stringToArrayBuffer(text),
                       filename, 'application/javascript');
  }

  await addApiModule('browser', browserModule);
  await addApiModule('config', configModule);
  await addApiModule('dialog', dialogModule);
  await addApiModule('messages', messageModule);
  await addApiModule('table', tableModule);
  await addApiModule('storage', {
    local: LocalStorageFileStorage,
    memory: MemoryFileStorage,
    remote: FileAPIFileStorage
  });
  await addApiModule('utils', utilsModule);

  await fileSystem.mount([], apiStorage, 'api');

  await fileSystem.refresh();

  return fileSystem
}

setupFileSystem()
    .catch((error) => {
      console.log(error);
      alert("Error setting up file system: " + error)
    });


export {FileSystem, setupFileSystem};

export default setupFileSystem;

