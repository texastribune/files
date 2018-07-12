import {FileAPIFileStorage} from "./files/storages/remote.js";
import {MemoryFileStorage} from "./files/storages/memory.js";
import {LocalStorageFileStorage} from "./files/storages/local.js";
import {FileSystem} from "./files/systems.js";

import * as browserModule from './ui/browser.js';
import * as configModule from './ui/config.js';
import * as dialogModule from './ui/dialog.js';
import * as messageModule from './ui/messages.js';
import * as tableModule from './ui/table.js';
import * as utilsModule from './utils.js';

import alert from './bin/alert.js';
import archive from './bin/archive.js';
import browser from './bin/browser.js';
import cd from './bin/cd.js';
import find from './bin/find.js';
import ls from './bin/ls.js';
import terminal from './bin/terminal.js';
import mount from './bin/mount.js';
import mountFileAPI from './bin/mount.fileapi.js';
import mountPhotoshelter from './bin/mount.photoshelter.js';


export class StandardFileSystem extends FileSystem {
  constructor(){
    let local = new LocalStorageFileStorage();
    super(local);

    let rootFileObject = this.rootFileObject;

    this._modules = {};
    this._binFuncs = {};

    this.apiStorage = new MemoryFileStorage();
    this._addApiModule('browser', browserModule);
    this._addApiModule('config', configModule);
    this._addApiModule('dialog', dialogModule);
    this._addApiModule('messages', messageModule);
    this._addApiModule('table', tableModule);
    this._addApiModule('storage', {
      local: LocalStorageFileStorage,
      memory: MemoryFileStorage,
      remote: FileAPIFileStorage
    });
    this._addApiModule('utils', utilsModule);

    this.binStorage = new MemoryFileStorage();
    this._addBinExecutable('alert', alert);
    this._addBinExecutable('archive', archive);
    this._addBinExecutable('browser', browser);
    this._addBinExecutable('cd', cd);
    this._addBinExecutable('find', find);
    this._addBinExecutable('ls', ls);
    this._addBinExecutable('terminal', terminal);
    this._addBinExecutable('mount', mount);
    this._addBinExecutable('mount.fileapi', mountFileAPI);
    this._addBinExecutable('mount.photoshelter', mountPhotoshelter);

    this.mount(rootFileObject, this.apiStorage, 'api');
    this.mount(rootFileObject, this.binStorage, 'bin');
  }

  _addBinExecutable(name, func){
    // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
    this._binFuncs[name] = func;
    let text = `let main = async (...args) => {return await this._binFuncs["${name}"].bind(this)(...args);}`;
    let filename = `${name}.js`;
    let file = new File([text], filename, {type: 'application/javascript'});
    this.binStorage.addFile(this.binStorage.rootFileNode, file, filename);
  }

  _addApiModule(name, module){
    // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
    this._modules[name] = module;
    let text = '';
    for (let variableName in module){
      text += `let ${variableName} = this._modules["${name}"]["${variableName}"];`
    }
    let filename = `${name}.js`;
    this.apiStorage.addFile(this.apiStorage.rootFileNode, new File([text], filename, {type: 'application/javascript'}), filename);
  }

  clone(){
    // TODO Make file system stateless and move state into browser so this is not so ugly.
    let clone = new this.constructor();
    clone._path = this._path;
    clone._currentDirectory = this._currentDirectory;
    clone._data = Object.assign({}, this._data);
    clone.trackState = false;
    for (let mount of this._mounts){
      clone.mount(mount.fileObject, mount.fileStorage, mount.name);
    }
    return clone;
  }
}
