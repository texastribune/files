import {ProxyDirectory} from "./proxy";
import {Directory} from "./base";

class AbstractVirtualDirectory extends ProxyDirectory {
  constructor(concreteDirectory : Directory){
    super(concreteDirectory);
  }

  get virtualRoot(){
    throw new Error("Not implemented");
  }

  async getChildren(){
    let children = await super.getChildren();
    let virtualChildren = [];
    for (let child of children){
      if (child.directory){
        virtualChildren.push(new VirtualDirectory(this.virtualRoot, child));
      } else {
        virtualChildren.push(child);
      }
    }
    return virtualChildren;
  }
}

class VirtualDirectory extends AbstractVirtualDirectory {
  constructor(virtualRoot, concreteFile){
    super(concreteFile);
    this._virtualRoot = virtualRoot;
  }

  get virtualRoot(){
    return this._virtualRoot;
  }
}

export class VirtualRootDirectory extends AbstractVirtualDirectory {
  constructor(concreteFile){
    super(concreteFile);

    this._mounts = {};
  }

  get virtualRoot(){
    return this;
  }

  async mount(mountPoint, directory) {
    this._mounts[mountPoint.id] = directory;
  }
}
