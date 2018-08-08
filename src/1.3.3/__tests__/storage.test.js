/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryFileStorage} from "../js/files/storages/memory.js";
import {parseTextFile} from "../js/utils.js";


describe('Test memory file storage', () => {
  let storage;

  beforeEach(() => {
    storage = new MemoryFileStorage();
  });

  async function addTestFiles(){
    let root = storage.rootFileNode;
    let file1 = new File(['abc'], 'file1', {type: 'text/plain'});
    let file2 = new File(['def'], 'file2', {type: 'text/plain'});
    let dir1Node = await storage.addDirectory(root, 'dir1');
    let file1Node = await storage.addFile(root, file1, 'file1');
    let file2Node = await storage.addFile(dir1Node, file2, 'file2');
    return [dir1Node, file1Node, file2Node];
  }

  test('Storage can add files and directories', async () => {
    let fileNodes = await addTestFiles();
    let rootFileNodes = await storage.listDirectory(storage.rootFileNode);
    let dir1FileNodes = await storage.listDirectory(fileNodes[0]);

    expect(rootFileNodes).toHaveProperty('file1');
    expect(rootFileNodes).toHaveProperty('dir1');
    expect(dir1FileNodes).toHaveProperty('file2');

    expect(rootFileNodes.dir1.id).toMatch(fileNodes[0].id);
    expect(rootFileNodes.dir1.name).toMatch('dir1');
    expect(rootFileNodes.file1.id).toMatch(fileNodes[1].id);
    expect(rootFileNodes.file1.name).toMatch('file1');
    expect(dir1FileNodes.file2.id).toMatch(fileNodes[2].id);
    expect(dir1FileNodes.file2.name).toMatch('file2');

    expect(rootFileNodes.file1).toEqual(fileNodes[1]);
    expect(dir1FileNodes.file2).toEqual(fileNodes[2]);
  });

  test('It can read files and directories', async () => {
    let fileNodes = await addTestFiles();
    let rootFileNodes = await storage.listDirectory(storage.rootFileNode);
    let dir1FileNodes = await storage.listDirectory(fileNodes[0]);

    let rootDirFile = await storage.readFileNode(storage.rootFileNode);
    let dir1File = await storage.readFileNode(fileNodes[0]);
    let file1File = await storage.readFileNode(fileNodes[1]);
    let file2File = await storage.readFileNode(fileNodes[2]);

    // Directories should be json objects of names mapped to file node data.
    let rootDirText = await parseTextFile(rootDirFile);
    let dir1Text = await parseTextFile(dir1File);

    let rootFileNodesFromRead = JSON.parse(rootDirText);
    let dir1FileNodesFromRead = JSON.parse(dir1Text);

    expect(rootFileNodesFromRead).toEqual(rootFileNodes);
    expect(dir1FileNodesFromRead).toEqual(dir1FileNodes);

    // File should have same data it was given.
    let file1Text = await parseTextFile(file1File);
    let file2Text = await parseTextFile(file2File);
    expect(file1Text).toMatch('abc');
    expect(file2Text).toMatch('def');
  });

  test('It can delete files and directories', async () => {
    let fileNodes = await addTestFiles();

    await storage.delete(fileNodes[1]);
    let rootFiles = await storage.listDirectory(storage.rootFileNode);
    expect(rootFiles).not.toHaveProperty('file1');
    expect(rootFiles).toHaveProperty('dir1');
  });
});
