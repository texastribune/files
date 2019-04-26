import {ProxyDirectory} from "./proxy";
import * as files from "./base";

export class VirtualDirectory<T extends files.Directory> extends ProxyDirectory<T> {
  private readonly mounts : {[id : string] : files.Directory};

  constructor(concreteDirectory : T, mounts : {[id : string] : files.Directory}){
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


  async addDirectory(name: string): Promise<files.Directory> {
    let dir = await super.addDirectory(name);
    return new VirtualDirectory(dir, this.mounts);
  }

  mount(file : files.Directory){
    this.mounts[this.id] = file;
    file.addOnChangeListener((file : files.File) => {
      this.dispatchChangeEvent();
    });
    this.dispatchChangeEvent();
  }

  unount(file : files.Directory){
    if (this.mounts.hasOwnProperty(file.id)){
      delete this.mounts[file.id];
      this.dispatchChangeEvent();
    }
  }
}


class MountedDirectory<T extends files.Directory> extends VirtualDirectory<T> {
  private readonly mountPointName : string;

  constructor(concreteDirectory : T, name : string){
    super(concreteDirectory, {});

    this.mountPointName = name;
  }

  get name() : string {
    return this.mountPointName;
  }
}

export class VirtualFS<T extends files.Directory> extends MountedDirectory<T> {
  constructor(concreteDirectory : T){
    super(concreteDirectory, concreteDirectory.name);
  }
}