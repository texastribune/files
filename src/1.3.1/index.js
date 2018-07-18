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


export default class StandardFileSystem extends FileSystem {
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
}