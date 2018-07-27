/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryFileStorage} from "../js/files/storages/memory.js";
import {
  BaseFileSystem,
  MountStorageMixin,
  StateMixin,
  HiddenReferenceLinkMixin,
  ExecutableMixin
} from "../js/files/systems.js";
import {FileObject} from "../js/files/objects.js";
import {parseTextArrayBuffer, stringToArrayBuffer} from "../js/utils.js";

const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';

const file1Text = 'abc';
const file2Text = 'def';

async function addTestFiles(system){
  let dir1FileObject = await system.addDirectory([], dir1Name);
  let file1FileObject = await system.addFile([], stringToArrayBuffer(file1Text),
                                             file1Name, 'text/plain');
  let file2FileObject = await system.addFile([dir1Name], stringToArrayBuffer(file2Text),
                                             file2Name, 'text/plain');
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

    expect(file).toBeInstanceOf(ArrayBuffer);
    let text = parseTextArrayBuffer(file);
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
    let mountName = 'mount-name';
    let filename = 'mounted-file.txt';
    let rootFileNode = await storage.getRootFileNode();
    let mountedFileNode = await mountedStorage.addFile(rootFileNode.id, stringToArrayBuffer('mount'),
                                                       filename, 'text/plain');
    system.mount(fileObjects[0], mountedStorage, mountName);
    let dir1FileObjects = await system.listDirectory([dir1Name]);

    expect(dir1FileObjects).toHaveProperty(mountName);
    let mountedFileObject = await system.getFileObject([dir1Name, mountName, filename]);
    expect(mountedFileObject).toBeInstanceOf(FileObject);
    expect(mountedFileObject.id).toMatch(mountedFileNode.id);
    expect(mountedFileObject.name).toMatch(filename);
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
    let rootFileNode = await storage.getRootFileNode();
    let newFileNode = await storage.addFile(rootFileNode.id, stringToArrayBuffer('new'),
                                            'new-file.txt', 'text/plain');
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
    await system.addFile([], stringToArrayBuffer(scriptText), fileName, 'text/javascript');

    let imported = await system.import([fileName], variableName);

    expect(imported).toMatch(testString);
  });

  test('System executes file', async () => {
    global.alert = jest.fn();
    await system.addDirectory([], executableDirName);
    let scriptText = 'async function main(){alert("Test")}';
    let commandName = 'test';
    await system.addFile([executableDirName], stringToArrayBuffer(scriptText), `${commandName}.js`, 'text/javascript');

    await system.exec(commandName);

    expect(global.alert).toBeCalled();
  });
});
