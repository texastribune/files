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
import {parseTextArrayBuffer, stringToArrayBuffer, compareById} from "../js/utils.js";

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

    let rootChildFileObjects = await system.listDirectory([]);
    let dir1ChildFileObjects = await system.listDirectory([dir1Name]);

    let rootChildNames = rootChildFileObjects.map((fileObject) => {return fileObject.fileNode.name});
    let dir1ChildNames = dir1ChildFileObjects.map((fileObject) => {return fileObject.fileNode.name});

    expect(rootChildNames).toContain(dir1Name);
    expect(rootChildNames).toContain(file1Name);
    expect(dir1ChildNames).toContain(file2Name);
  });

  test('System listDirectory returns correct FileObjects', async () => {
    let fileObjects = await addTestFiles(system);
    let rootExpectedChildren = [fileObjects[0], fileObjects[1]];
    let dir1ExpectedChildren = [fileObjects[2]];

    let rootChildFileObjects = await system.listDirectory([]);
    let dir1ChildFileObjects = await system.listDirectory([dir1Name]);

    // Get the FileObject data which should not change since it was added or directly written to
    // Directory size, lastModified, and url can change when child files are added.
    function staticData(fileObject){
        let staticData = {
            id: fileObject.fileNode.id,
            name: fileObject.fileNode.name,
            created: fileObject.fileNode.created,
            directory: fileObject.fileNode.directory,
            mimeType: fileObject.fileNode.mimeType
        };
        if (!fileObject.fileNode.directory){
            staticData.size = fileObject.fileNode.size;
            staticData.lastModified = fileObject.fileNode.lastModified;
            staticData.url = fileObject.fileNode.url;
        }
        return staticData;
    }

    let rootFileObjectsStaticData = rootChildFileObjects.map(staticData);
    let dir1FileObjectsStaticData = dir1ChildFileObjects.map(staticData);

    let rootExpectedStaticData = rootExpectedChildren.map(staticData);
    let dir1ExpectedStaticData = dir1ExpectedChildren.map(staticData);

    expect(rootFileObjectsStaticData.sort(compareById)).toEqual(rootExpectedStaticData.sort(compareById));
    expect(dir1FileObjectsStaticData.sort(compareById)).toEqual(dir1ExpectedStaticData.sort(compareById));
  });

  test('Can read file objects', async () => {
    let fileObjects = await addTestFiles(system);
    let fileObject = await system.getFileObject([file1Name]);
    let fileData = await fileObject.read();

    expect(fileData).toBeInstanceOf(ArrayBuffer);
    let text = parseTextArrayBuffer(fileData);
    expect(text).toMatch(file1Text);
  });

  test('System can delete files and directories', async () => {
    let fileObjects = await addTestFiles(system);

    await fileObjects[1].delete();
    let rootChildFileObjects = await system.listDirectory([]);

    let rootChildNames = rootChildFileObjects.map((fileObject) => {return fileObject.fileNode.name});
    expect(rootChildNames).not.toContain(file1Name);
    expect(rootChildNames).toContain(dir1Name);
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
    await system.mount(fileObjects[0].path, mountedStorage, mountName);

    let dir1ChildFileObjects = await system.listDirectory([dir1Name]);
    let dir1ChildNames = dir1ChildFileObjects.map((fileObject) => {return fileObject.fileNode.name});

    expect(dir1ChildNames).toContain(mountName);
    let mountedFileObject = await system.getFileObject([dir1Name, mountName, filename]);
    expect(mountedFileObject).toBeInstanceOf(FileObject);
    expect(mountedFileObject.fileNode.id).toMatch(mountedFileNode.id);
    expect(mountedFileObject.fileNode.name).toMatch(filename);
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
    let rootChildFileObjects = await system.listDirectory([]);
    let rootChildFileNames = rootChildFileObjects.map((fileObject) => {return fileObject.fileNode.name});

    expect(rootChildFileNames).toContain('.');
    expect(rootChildFileNames).not.toContain('..');

    let dir1ChildFileObjects = await system.listDirectory([dir1Name]);
    let dir1ChildFileNames = dir1ChildFileObjects.map((fileObject) => {return fileObject.fileNode.name});

    expect(dir1ChildFileNames).toContain('.');
    expect(dir1ChildFileNames).toContain('..');
  });

  test('Can add link as file', async () => {
    let fileObjects = await addTestFiles(system);

    // Add a file containing json string of file1 path in dir1 as a link to file1.
    let file1Path = fileObjects[1].path;
    let linkData = stringToArrayBuffer(JSON.stringify(file1Path));
    let dir1Path = fileObjects[0].path;
    let linkFileObject = await system.addFile(dir1Path, linkData, 'file1link', system.constructor.linkMimeType);

    // Make the link and file its linking to are at different paths
    expect(linkFileObject.path).not.toEqual(file1Path);

    // Trying to read the link path should return the file its linking to
    let fileObject = await system.getFileObject(linkFileObject.path);
    expect(fileObject.fileNode).toEqual(fileObjects[1].fileNode);
  });

  test('System get file through link path', async () => {
    let fileObjects = await addTestFiles(system);

    // Type should be inode/symlink
    let fileObject2 = await system.getFileObject([dir1Name, '.', file2Name]);
    expect(fileObject2.fileNode.name).toEqual(file2Name);

    // Type should be inode/symlink
    let fileObject1 = await system.getFileObject([dir1Name, '.', '..', file1Name]);
    expect(fileObject1.fileNode.name).toEqual(file1Name);
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
