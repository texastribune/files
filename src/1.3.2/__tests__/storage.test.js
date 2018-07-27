/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryFileStorage} from "../js/files/storages/memory.js";
import {parseTextArrayBuffer, parseJsonArrayBuffer, stringToArrayBuffer} from "../js/utils.js";
import IndexedDB from "../../../node_modules/fake-indexeddb/build/index.js";
import {LocalStorageFileStorage} from "../js/files/storages/local";


async function listStorageDirectory(storage, fileNode) {
    let directoryArrayBuffer = await storage.readFileNode(fileNode.id);
    return parseJsonArrayBuffer(directoryArrayBuffer);
}

function testStorage(createStorage){
  let storage;
  let file1String = 'abc';
  let file2String = 'def';
  let file1Name = 'file1';
  let file2Name = 'file2';
  let dir1Name = 'dir1';

  beforeEach(() => {
    storage = createStorage();
  });

  async function addTestFiles(){
    let rootFileNode = await storage.getRootFileNode();
    let dir1Node = await storage.addDirectory(rootFileNode.id, dir1Name);
    let file1Node = await storage.addFile(rootFileNode.id, stringToArrayBuffer(file1String), file1Name, 'text/plain');
    let file2Node = await storage.addFile(dir1Node.id, stringToArrayBuffer(file2String), file2Name);
    return [dir1Node, file1Node, file2Node];
  }

  test('Storage directories are files with json string of FileNodes', async () => {
    let fileNodes = await addTestFiles();

    // Read dir1 which is a directory. Check contains json with correct files.
    let directoryArrayBuffer = await storage.readFileNode(fileNodes[0].id);
    let data = parseJsonArrayBuffer(directoryArrayBuffer);
    expect(data).toHaveProperty(file2Name);
  });

  test('Storage can add files and directories', async () => {
    let fileNodes = await addTestFiles();
    let rootFileNode = await storage.getRootFileNode();
    let rootFileNodes = await listStorageDirectory(storage, rootFileNode);
    let dir1FileNodes = await listStorageDirectory(storage, fileNodes[0]);

    expect(rootFileNodes).toHaveProperty(file1Name);
    expect(rootFileNodes).toHaveProperty(dir1Name);
    expect(dir1FileNodes).toHaveProperty(file2Name);

    expect(rootFileNodes.dir1.id).toMatch(fileNodes[0].id);
    expect(rootFileNodes.dir1.name).toMatch(dir1Name);
    expect(rootFileNodes.file1.id).toMatch(fileNodes[1].id);
    expect(rootFileNodes.file1.name).toMatch(file1Name);
    expect(dir1FileNodes.file2.id).toMatch(fileNodes[2].id);
    expect(dir1FileNodes.file2.name).toMatch(file2Name);

    expect(rootFileNodes.file1).toEqual(fileNodes[1]);
    expect(dir1FileNodes.file2).toEqual(fileNodes[2]);
  });

  test('Storage correct mime types', async () => {
    let fileNodes = await addTestFiles();

      expect(fileNodes[0].mimeType).toMatch('application/json'); // All directories should be json files
      expect(fileNodes[1].mimeType).toMatch('text/plain'); // As was defined in addFile
      expect(fileNodes[2].mimeType).toMatch('application/octet-stream'); // Fallback since not given in addFile
  });

  test('Storage cannot add files or directories to non directory', async () => {
    let rootFileNode = await storage.getRootFileNode();
    let file1Node = await storage.addFile(rootFileNode.id, stringToArrayBuffer('jkl'), 'file', 'text/plain');
    let error;

    // Try to add a file to file1.
    error = null;
    try {
      await storage.addFile(file1Node.id, stringToArrayBuffer('mno'), 'anotherFile', 'text/plain');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);

    // Try to add a directory to file1.
    error = null;
    try {
      await storage.addDirectory(file1Node.id, 'directory');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
  });

  test('Storage cannot add wrong type', async () => {
    let rootFileNode = await storage.getRootFileNode();
    let error;

    // Test can't add Blob
    error = null;
    try {
      await storage.addFile(rootFileNode.id, new Blob(['stu']), 'file', 'text/plain');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);

    // Test can't add plain string
    error = null;
    try {
      await storage.addFile(rootFileNode.id, 'stu', 'file', 'text/plain');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
  });

  test('It can read files and directories', async () => {
    let fileNodes = await addTestFiles();
    let rootFileNode = await storage.getRootFileNode();
    let rootFileNodes = await listStorageDirectory(storage, rootFileNode);
    let dir1FileNodes = await listStorageDirectory(storage, fileNodes[0]);

    let rootDirArrayBuffer = await storage.readFileNode(rootFileNode.id);
    let dir1ArrayBuffer = await storage.readFileNode(fileNodes[0].id);
    let file1ArrayBuffer = await storage.readFileNode(fileNodes[1].id);
    let file2ArrayBuffer = await storage.readFileNode(fileNodes[2].id);

    expect(rootDirArrayBuffer).toBeInstanceOf(ArrayBuffer);
    expect(dir1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
    expect(file1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
    expect(file2ArrayBuffer).toBeInstanceOf(ArrayBuffer);

    // Directories should be json objects of names mapped to file node data.
    let rootDirText = parseTextArrayBuffer(rootDirArrayBuffer);
    let dir1Text = parseTextArrayBuffer(dir1ArrayBuffer);

    let rootFileNodesFromRead = JSON.parse(rootDirText);
    let dir1FileNodesFromRead = JSON.parse(dir1Text);

    expect(rootFileNodesFromRead).toEqual(rootFileNodes);
    expect(dir1FileNodesFromRead).toEqual(dir1FileNodes);

    // File should have same data it was given.
    let file1Text = parseTextArrayBuffer(file1ArrayBuffer);
    let file2Text = parseTextArrayBuffer(file2ArrayBuffer);
    expect(file1Text).toMatch(file1Text);
    expect(file2Text).toMatch(file2Text);
  });

  test('It can delete files and directories', async () => {
    let fileNodes = await addTestFiles();
    let rootFileNode = await storage.getRootFileNode();

    await storage.delete(fileNodes[1].id);
    let rootFiles = await listStorageDirectory(storage, rootFileNode);
    expect(rootFiles).not.toHaveProperty(file1Name);
    expect(rootFiles).toHaveProperty(dir1Name);
  });
}



describe('Test memory file storage', () => {
  testStorage(() => {
    return new MemoryFileStorage();
  })
});

global.window.indexedDB = IndexedDB;

describe('Test local file storage', () => {
  testStorage(() => {
    window.indexedDB._databases.clear();
    return new LocalStorageFileStorage();
  })
});