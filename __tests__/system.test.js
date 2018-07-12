/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryFileStorage} from "../v1.3/js/files/storages/memory.js";
import {
  BaseFileSystem,
  MountStorageMixin,
  StateMixin,
  HiddenReferenceLinkMixin,
  ExecutableMixin
} from "../v1.3/js/files/systems.js";
import {FileObject} from "../v1.3/js/files/objects.js";
import {parseTextFile} from "../v1.3/js/utils.js";

const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';

const file1Text = 'abc';
const file2Text = 'def';

async function addTestFiles(system){
  let file1 = new File([file1Text], file1Name, {type: 'text/plain'});
  let file2 = new File([file2Text], file2Name, {type: 'text/plain'});
  let dir1FileObject = await system.addDirectory([], dir1Name);
  let file1FileObject = await system.addFile([], file1, file1Name);
  let file2FileObject = await system.addFile([dir1Name], file2, file2Name);
  return [dir1FileObject, file1FileObject, file2FileObject];
}

describe('Test base file system', () => {
  let system;
  let storage;

  beforeEach(() => {
    storage = new MemoryFileStorage();
    system = new BaseFileSystem(storage);
  });

  test('System can add files and directories', async () => {
    let fileObjects = await addTestFiles(system);

    let rootFileObjects = await system.listDirectory([]);
    let dir1FileObjects = await system.listDirectory([dir1Name]);

    expect(rootFileObjects).toHaveProperty(file1Name);
    expect(rootFileObjects).toHaveProperty(dir1Name);
    expect(dir1FileObjects).toHaveProperty(file2Name);

    expect(rootFileObjects.dir1).toBeInstanceOf(FileObject);
    expect(rootFileObjects.file1).toBeInstanceOf(FileObject);
    expect(dir1FileObjects.file2).toBeInstanceOf(FileObject);

    expect(rootFileObjects.dir1.id).toMatch(fileObjects[0].id);
    expect(rootFileObjects.dir1.name).toMatch(dir1Name);
    expect(rootFileObjects.file1.id).toMatch(fileObjects[1].id);
    expect(rootFileObjects.file1.name).toMatch(file1Name);
    expect(dir1FileObjects.file2.id).toMatch(fileObjects[2].id);
    expect(dir1FileObjects.file2.name).toMatch(file2Name);
  });

  test('System can read files', async () => {
    let fileObjects = await addTestFiles(system);
    let file = await system.read([file1Name]);

    expect(file).toBeInstanceOf(File);
    let text = await parseTextFile(file);
    expect(text).toMatch(file1Text);
  });

  test('System can delete files and directories', async () => {
    let fileObjects = await addTestFiles(system);

    await fileObjects[1].delete();
    let rootFileObjects = await system.listDirectory([]);
    expect(rootFileObjects).not.toHaveProperty(file1Name);
    expect(rootFileObjects).toHaveProperty(dir1Name);
  });
});

describe('Test mounting mixin', () => {
  let system;
  let storage;

  beforeEach(() => {
    storage = new MemoryFileStorage();
    let SystemClass = MountStorageMixin(BaseFileSystem);
    system = new SystemClass(storage);
  });

  test('System can mount directories', async () => {
    let fileObjects = await addTestFiles(system);
    let mountedStorage = new MemoryFileStorage();
    let mountedFileNode = await mountedStorage.addFile(mountedStorage.rootFileNode, new File(['mount'], 'mounted-file'), 'mounted-file');
    system.mount(fileObjects[0], mountedStorage, 'mount-name');
    let dir1FileObjects = await system.listDirectory([dir1Name]);

    expect(dir1FileObjects).toHaveProperty('mount-name');
    let mountedFileObject = await system.getFileObject([dir1Name, 'mount-name', 'mounted-file']);
    expect(mountedFileObject).toBeInstanceOf(FileObject);
    expect(mountedFileObject.id).toMatch(mountedFileNode.id);
    expect(mountedFileObject.name).toMatch('mounted-file');
    expect(mountedFileObject.fileStorage).toBe(mountedStorage);

    // Dir1 still has same file storage;
    expect(fileObjects[0].fileStorage).toBe(storage);
  });

  test('System search across mounted directories', async () => {

  })
});

describe('Test state mixin', () => {
  let system;
  let storage;

  beforeEach(() => {
    storage = new MemoryFileStorage();
    let SystemClass = StateMixin(BaseFileSystem);
    system = new SystemClass(storage);
  });

  test('System path and data', async () => {
    let fileObjects = await addTestFiles(system);
    await system.changeDirectory([]);
    let rootFileObjects = await system.listDirectory([]);

    expect(system.path).toEqual([]);
    expect(system.data).toEqual(rootFileObjects);

    system.changeDirectory([])
  });

  test('System refresh data', async () => {
    let fileObjects = await addTestFiles(system);
    await system.changeDirectory([]);
    let rootFileObjects = await system.listDirectory([]);

    // Initial data should be files in root directory.
    expect(system.data).toEqual(rootFileObjects);

    // Data should still be initial data
    await system.refresh();
    expect(system.data).toEqual(rootFileObjects);

    // Add file via storage class. Data should still be initial data because there has not been a refresh.
    let newFileNode = await storage.addFile(storage.rootFileNode, new File(['new'], 'new-file'), 'new-file');
    expect(system.data).toEqual(rootFileObjects);

    // After refresh data should have changed.
    await system.refresh();
    expect(system.data).not.toEqual(rootFileObjects);
  })
});

describe('Test hidden reference link mixin', () => {
  let system;
  let storage;

  beforeEach(() => {
    storage = new MemoryFileStorage();
    let SystemClass = HiddenReferenceLinkMixin(BaseFileSystem);
    system = new SystemClass(storage);
  });

  test('System has link references', async () => {
    let fileObjects = await addTestFiles(system);
    let rootFileObjects = await system.listDirectory([]);
    let rootFilenames = Object.keys(rootFileObjects);

    expect(rootFilenames).toContain('.');
    expect(rootFilenames).not.toContain('..');

    let dir1FileObjects = await system.listDirectory([dir1Name]);
    let dir1Filenames = Object.keys(dir1FileObjects);

    expect(dir1Filenames).toContain('.');
    expect(dir1Filenames).toContain('..');
  });

  test('System links have right properties', async () => {
    let fileObjects = await addTestFiles(system);
    let dir1link = await system.getFileObject([dir1Name, '.']);
    let dir1Parentlink = await system.getFileObject([dir1Name, '..']);

    // Type should be inode/symlink
    expect(dir1link.mimeType).toMatch('inode/symlink');
    expect(dir1Parentlink.mimeType).toMatch('inode/symlink');

    // File should contain JSON path string
    expect(await dir1link.readJSON()).toEqual([dir1Name]);
    expect(await dir1Parentlink.readJSON()).toEqual([]);
  });

  test('System get file through link path', async () => {
    let fileObjects = await addTestFiles(system);

    // Type should be inode/symlink
    let fileObject2 = await system.getFileObject([dir1Name, '.', file2Name]);
    expect(fileObject2.name).toEqual(file2Name);

    // Type should be inode/symlink
    let fileObject1 = await system.getFileObject([dir1Name, '.', '..', file1Name]);
    expect(fileObject1.name).toEqual(file1Name);
  });
});

describe('Test executable mixin', () => {
  let system;
  let storage;
  let executableDirName = 'executables';

  beforeEach(() => {
    storage = new MemoryFileStorage();
    let SystemClass = ExecutableMixin(BaseFileSystem);
    system = new SystemClass(storage);
    system.executablePath = [
      [executableDirName]
    ]
  });

  test('System imports from file', async () => {
    global.alert = jest.fn();
    let testString = 'abcd';
    let variableName = 'textVar';
    let scriptText = `let ${variableName} = "${testString}";`;
    let fileName = 'test.js';
    await system.addFile([], new File([scriptText], fileName, {type: 'text/javascript'}), fileName);

    let imported = await system.import([fileName], variableName);

    expect(imported).toMatch(testString);
  });

  test('System executes file', async () => {
    global.alert = jest.fn();
    await system.addDirectory([], executableDirName);
    let scriptText = 'async function main(){alert("Test")}';
    let commandName = 'test';
    await system.addFile([executableDirName], new File([scriptText], `${commandName}.js`, {type: 'text/javascript'}), `${commandName}.js`);

    await system.exec(commandName);

    expect(global.alert).toBeCalled();
  });
});
