// import {FileAPIFileStorage} from "./src/1.3.2/js/files/storages/remote.js";
// import {MemoryFileStorage} from "./src/1.3.2/js/files/storages/memory.js";
// import {LocalStorageFileStorage} from "./src/1.3.2/js/files/storages/local.js";
// import {FileSystem, BaseFileSystem} from "./js/files/systems.js";
//
// import * as browserModule from './js/ui/browser.js';
// import * as configModule from './js/ui/config.js';
// import * as dialogModule from './js/ui/dialog.js';
// import * as messageModule from './js/ui/messages.js';
// import * as tableModule from './js/ui/table.js';
// import * as utilsModule from './js/utils.ts';
//
// import alert from './js/bin/alert.js';
// import archive from './js/bin/archive.js';
// import browser from './js/bin/browser.js';
// import cd from './js/bin/cd.js';
// import find from './js/bin/find.js';
// import ls from './js/bin/ls.js';
// import terminal from './js/bin/terminal.js';
// import mount from './js/bin/mount.js';
// import mountFileAPI from './js/bin/mount.fileapi.js';
// import mountPhotoshelter from './js/bin/mount.photoshelter.js';
// import {LocalStorageRoot} from "./js/files/local.ts";
// import {VirtualRootDirectory} from "./js/files/virtual";
// import {stringToArrayBuffer} from "./js/utils";
// import {Process} from "./js/processes/base.ts";
//
// let files = {
//   bin: {
//     alert: alert();
//   }
// };
//
// //
// // let initramfs = new MemoryDirectory();
// // let initScript = `
// //   alert("HELLO WORLD");
// // `;
// // initramfs.addFile(stringToArrayBuffer(initScript), 'init.js', 'application/javascript');
// //
// // let initProcess = new Process(null, initramfs, 'init.js');
// //
// // async function setupFileSystem(){
// //   let rootStorage = new VirtualRootDirectory(new MemoryDirectory());
// //
// //   rootStorage._binFuncs = {};
// //   let binStorage = new MemoryFileStorage();
// //   let binStorageRootFileNode =  await binStorage.getRootFileNode();
// //
// //   async function addBinExecutable(name, func){
// //     // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
// //     rootStorage._binFuncs[name] = func;
// //     let text = `let main = async (...args) => {return await this._binFuncs["${name}"].bind(this)(...args);}`;
// //     let filename = `${name}.js`;
// //     await binStorage.addFile(binStorageRootFileNode.id, utilsModule.stringToArrayBuffer(text),
// //                              filename, 'application/javascript');
// //   }
// //
// //   await addBinExecutable('alert', alert);
// //   await addBinExecutable('archive', archive);
// //   await addBinExecutable('browser', browser);
// //   await addBinExecutable('cd', cd);
// //   await addBinExecutable('find', find);
// //   await addBinExecutable('ls', ls);
// //   await addBinExecutable('terminal', terminal);
// //   await addBinExecutable('mount', mount);
// //   await addBinExecutable('mount.fileapi', mountFileAPI);
// //   await addBinExecutable('mount.photoshelter', mountPhotoshelter);
// //
// //   await fileSystem.addDirectory('bin');
// //   await fileSystem.mount(['bin'], binStorage);
// //
// //
// //   fileSystem._modules = {};
// //   let apiStorage = new MemoryFileStorage();
// //   let apiStorageRootFileNode =  await apiStorage.getRootFileNode();
// //
// //   async function addApiModule(name, module){
// //     // TODO Update to use dynamic import when available https://developers.google.com/web/updates/2017/11/dynamic-import
// //     fileSystem._modules[name] = module;
// //     let text = '';
// //     for (let variableName in module){
// //       text += `let ${variableName} = this._modules["${name}"]["${variableName}"];`
// //     }
// //     let filename = `${name}.js`;
// //     await apiStorage.addFile(apiStorageRootFileNode.id, utilsModule.stringToArrayBuffer(text),
// //                        filename, 'application/javascript');
// //   }
// //
// //   await addApiModule('browser', browserModule);
// //   await addApiModule('config', configModule);
// //   await addApiModule('dialog', dialogModule);
// //   await addApiModule('messages', messageModule);
// //   await addApiModule('table', tableModule);
// //   await addApiModule('storage', {
// //     local: LocalStorageFileStorage,
// //     memory: MemoryFileStorage,
// //     remote: FileAPIFileStorage
// //   });
// //   await addApiModule('utils', utilsModule);
// //
// //   await fileSystem.addDirectory('api');
// //   await fileSystem.mount(['api'], apiStorage);
// //
// //   await fileSystem.refresh();
// //
// //   return fileSystem
// // }
// //
// //
// // export {FileSystem, setupFileSystem};
// //
// // export default setupFileSystem;
// //

// import to define custom elements
import  "./lib/1.3.2/js/ui/browser";
import "./lib/1.3.2/js/ui/contextMenu";

import {MemoryDirectory} from "./lib/1.3.2/js/files/memory";
import {Process} from "./lib/1.3.2/js/processes/base";
import {stringToArrayBuffer} from "./lib/1.3.2/js/utils";
import {ProcessDirectory} from "./lib/1.3.2/js/processes/files";
import {DeviceDirectory} from "./lib/1.3.2/js/devices/base";
import {VirtualFS} from "./lib/1.3.2/js/files/virtual";
import {RemoteFS} from "./lib/1.3.2/js/files/remote";

class InitFS extends MemoryDirectory {
  constructor(){
    super(null, 'root');

    this._extraChildren = [
        new DeviceDirectory(),
        new ProcessDirectory()
    ];
  }

  async getChildren(){
    let children = await super.getChildren();
    return children.concat(this._extraChildren);
  }
}


//language=Javascript
const init = `
  console.log("YAS");
`;

export async function createFS(){
    let fs = new VirtualFS(new MemoryDirectory(null, "root"));
    let files = await fs.addDirectory("Files");
    files.mount(new RemoteFS('/files/mediafiles/directory/'));
    // let dev = await fs.addDirectory('dev');
    // dev.mount(new DeviceDirectory());
    // let proc = await fs.addDirectory('proc');
    // proc.mount(new ProcessDirectory());
    // await fs.addFile(stringToArrayBuffer(init), 'init.js', 'application/javascript');
    // let devConsole = await fs.getFile(['dev', 'console']);
    // new Process(null, fs, ['init.js'], devConsole, devConsole);
    return fs;
}