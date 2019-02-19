import {ProxyDirectory} from "./proxy";
import * as files from "./base";

export class VirtualDirectory extends ProxyDirectory {
  private readonly mounts : {[id : string] : files.Directory};

  constructor(concreteDirectory : files.Directory, mounts? : {[id : string] : files.Directory}){
    super(concreteDirectory);

    this.mounts = mounts || {};
  }

  async getChildren(){
    let children = await super.getChildren();
    let virtualChildren = [];
    for (let child of children){
      let mounted = this.mounts[child.id];
      if (mounted !== undefined){
        virtualChildren.push(new VirtualDirectory(mounted));
      } else {
        if (child instanceof files.Directory){
          virtualChildren.push(new VirtualDirectory(child, this.mounts));
        } else {
          virtualChildren.push(child);
        }
      }
    }
    return virtualChildren;
  }


  async addDirectory(name: string): Promise<VirtualDirectory> {
    let dir = await super.addDirectory(name);
    return new VirtualDirectory(dir, this.mounts);
  }

  mount(file : files.Directory){
    this.mounts[this.id] = file;
  }
}
