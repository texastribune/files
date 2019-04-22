import {ProxyDirectory} from "./proxy";
import * as files from "./base";

class VirtualDirectory extends ProxyDirectory {
  private readonly mounts : {[id : string] : files.Directory};

  constructor(concreteDirectory : files.Directory, mounts : {[id : string] : files.Directory}){
    super(concreteDirectory);

    this.mounts = mounts;
  }

  async getChildren() : Promise<files.File[]> {
    let children = await super.getChildren();
    let virtualChildren = [];
    for (let child of children){
      let mounted = this.mounts[child.id];
      if (mounted !== undefined){
        virtualChildren.push(new MountedDirectory(mounted, child.name));
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


class MountedDirectory extends VirtualDirectory {
  private readonly mountPointName : string;

  constructor(concreteDirectory : files.Directory, name : string){
    super(concreteDirectory, {});

    this.mountPointName = name;
  }

  get name() : string {
    return this.mountPointName;
  }
}

export class VirtualFS extends MountedDirectory {
  constructor(concreteDirectory : files.Directory){
    super(concreteDirectory, concreteDirectory.name);
  }
}