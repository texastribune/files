import {ProxyDirectory} from "./proxy.js";
import * as files from "./base.js";
import {walkPath} from "./base.js";


abstract class AbstractVirtualDirectory<T extends files.Directory> extends ProxyDirectory<T> {
  abstract readonly virtualRoot : AbstractVirtualRootDirectory<files.Directory>;
  abstract readonly path : string[];

  getFile(pathArray: string[]): Promise<files.File> {
    // Force to walk path so that mount points are checked.
    return walkPath(pathArray, this);
  }

  async getChildren() : Promise<files.File[]> {
    let children = await super.getChildren();
    let virtualChildren = [];
    for (let child of children){
      let mountPointData = this.virtualRoot.getMountedData(child.id);
      if (mountPointData !== null){
        child = new VirtualRootDirectory(mountPointData.directory, mountPointData.subMounts, child, this);
      } else if (child instanceof files.Directory) {
        child = new VirtualDirectory(child, this);
      }

      virtualChildren.push(child);
    }
    return virtualChildren;
  }

  async addDirectory(name: string): Promise<VirtualDirectory<files.Directory>> {
    let dir = await super.addDirectory(name);
    return new VirtualDirectory(dir, this);
  }

  mount(file : files.Directory) {
    this.virtualRoot.mountTo(this, file);
  }
}

export class VirtualDirectory<T extends files.Directory> extends AbstractVirtualDirectory<T> {
  protected readonly parent : AbstractVirtualDirectory<files.Directory>;

  constructor(concreteDirectory : T, parent : AbstractVirtualDirectory<files.Directory>){
    super(concreteDirectory);

    this.parent = parent;
  }

  get virtualRoot() : AbstractVirtualRootDirectory<files.Directory> {
    return this.parent.virtualRoot;
  }

  get path() : string[] {
    return this.parent.path.concat([this.name]);
  }
}


interface MountPointData {
  directory: files.Directory,
  subMounts: {[id : string] : MountPointData},
}

abstract class AbstractVirtualRootDirectory<T extends files.Directory> extends AbstractVirtualDirectory<T> {
  private readonly mounts : {[id : string] : MountPointData};

  protected constructor(concreteDirectory : T, mounts : {[id : string] : MountPointData}){
    super(concreteDirectory);

    this.mounts = mounts;
  }

  get virtualRoot() {
    return this;
  }

  mountTo(mountPoint : AbstractVirtualDirectory<files.Directory>, file : files.Directory) {
    this.mounts[mountPoint.id] = {
      directory: file,
      subMounts: {},
    };
    this.dispatchChangeEvent();
  }

  unmountFrom(mountPoint : files.File){
    if (this.mounts.hasOwnProperty(mountPoint.id)){
      delete this.mounts[mountPoint.id];
      this.dispatchChangeEvent();
    }
  }

  getMountedData(id : string) : MountPointData| null {
    return this.mounts[id] || null;
  }
}

export class VirtualRootDirectory<T extends files.Directory> extends AbstractVirtualRootDirectory<T> {
  private readonly mountPoint : files.File;
  private readonly parent : AbstractVirtualDirectory<files.Directory>;

  constructor(concreteDirectory : T, mounts : {[id : string] : MountPointData}, mountPoint : files.File, parent : AbstractVirtualDirectory<files.Directory>){
    super(concreteDirectory, mounts);

    this.mountPoint = mountPoint;
    this.parent = parent;
  }

  get path() : string[] {
    return this.parent.path.concat([this.name]);
  }

  get name() : string {
    return this.mountPoint.name;
  }

  unmount(){
    this.parent.virtualRoot.unmountFrom(this.mountPoint);
  }
}


export class VirtualFS<T extends files.Directory> extends AbstractVirtualRootDirectory<T> {
  constructor(concreteDirectory : T){
    super(concreteDirectory, {});
  }

  get path() : string[] {
    return [this.name];
  }

  get name() : string {
    return "";
  }
}