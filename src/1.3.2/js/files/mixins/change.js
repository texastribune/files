import {AbstractDirectory} from "../base.js";

function wrapChangeFunc(func, callback) {
  return async (...args) => {
    let ret = await func(...args);
    callback();
    return ret;
  }
}

function overrideGetChildren(directory, onChange){
  directory.getChildren = async () => {
    let children = await directory.getChildren();
    for (let child of children) {
      let callback = () => {
        onChange(child);
      };
      child.write = wrapChangeFunc(child.write, callback);
      child.rename = wrapChangeFunc(child.rename, callback);
      child.delete = wrapChangeFunc(child.delete, callback);
      child.move = wrapChangeFunc(child.move, callback);
      if (child instanceof AbstractDirectory){
        overrideGetChildren(child, onChange);
      }
    }
    return children;
  }
}


/**
 * Extends a file system with StateMixin so that it can cache fileObjects that
 * have already been retrieved by their path.
 * @mixin OnChangeMixin
 * @param {AbstractDirectory} DirectoryClass - A subclass of BaseFileSystem.
 * @returns {AbstractDirectory}
 */
export let OnChangeMixin = (DirectoryClass) => {
  return class extends DirectoryClass {
    constructor(...args) {
      super(...args);
      this._onChangeListeners = [];
      overrideGetChildren(this, this.onFileChanged);
    }

    onFileChanged(file){
      for (let listener of this._onChangeListeners){
        listener(file);
      }
    }

    addOnChangeListener(listener){
      this._onChangeListeners.push(listener);
    }

    async stat(path){
      let strPath = JSON.stringify(path);
      let fileObject = this._pathCache[strPath];
      if (!fileObject){
        fileObject = await super.getFile(path);
        this._pathCache[strPath] = fileObject;
      }
      return fileObject;
    }

    async refresh(){
      this._pathCache = {};
      await super.refresh();
    }

    async getChildren(){
      if (child instanceof AbstractDirectory){
        let method = child.getChildren;
        child.getChildren = async () => {
          let children = await child.getChildren();
          for (let child of super.getChildren()) {
            child.write = wrapChangeFunc.bind(child)(child.write, this.onFileChanged);
            child.rename = wrapChangeFunc.bind(child)(child.rename, this.onFileChanged);
            child.delete = wrapChangeFunc.bind(child)(child.delete, this.onFileChanged);
            child.move = wrapChangeFunc.bind(child)(child.move, this.onFileChanged);
          }
        }
      }
    }
  };
};