/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryDirectory} from "../js/files/memory.ts";
import {parseTextArrayBuffer, parseJsonArrayBuffer, stringToArrayBuffer, compareById} from "../js/utils.ts";
import IndexedDB from "../../../node_modules/fake-indexeddb/build/index.js";
import {LocalStorageRoot, database} from "../js/files/local.js";
import {VirtualRootDirectory} from "../js/files/virtual.js";
import {BasicFile} from "../js/files/base.js";
import {NodeDirectory} from "../js/files/node.js";
import * as fs from 'fs';


async function listDirectoryDataFromRead(directory) {
    let directoryArrayBuffer = await directory.read();
    return parseJsonArrayBuffer(directoryArrayBuffer);
}

async function listDirectoryDataFromGetChildren(directory){
    let children = await directory.getChildren();
    let dataArray = [];
    for (let file of children){
      dataArray.push({
        id: file.id,
        name: file.name,
        directory: file.directory,
        url: file.url,
        icon: file.icon,
        size: file.size,
        mimeType: file.mimeType,
        lastModified: file.lastModified.toISOString(),
        created: file.created.toISOString(),
        extra: file.extra
      });
    }
    return dataArray;
}

function testStorage(rootDirectory) {
    let file1String = 'abc';
    let file2String = 'def';
    let file1Name = 'file1';
    let file2Name = 'file2';
    let dir1Name = 'dir1';

    async function addTestFiles() {
        let dir1 = await rootDirectory.addDirectory(dir1Name);
        let file1 = await rootDirectory.addFile(stringToArrayBuffer(file1String), file1Name);
        let file2 = await dir1.addFile(stringToArrayBuffer(file2String), file2Name, 'text/plain');
        return [dir1, file1, file2];
    }

    test('Directories are files with json array string', async () => {
        expect(rootDirectory).toBeInstanceOf(BasicFile);

        let arrayBuffer = await rootDirectory.read();
        let childData = parseJsonArrayBuffer(arrayBuffer);
        expect(childData).toBeInstanceOf(Array);
        expect(childData.length).toEqual(0);
    });

    test('Storage can add files and directories', async () => {
        let files = await addTestFiles();
        let rootChildFiles = await rootDirectory.getChildren();
        let dir1ChildFiles = await files[0].getChildren();

        expect(rootChildFiles[0].directory).toBe(true);
        expect(rootChildFiles[1].directory).toBe(false);

        let rootChildNames = rootChildFiles.map((file) => {return file.name});
        let dir1ChildNames = dir1ChildFiles.map((file) => {return file.name});

        expect(rootChildNames).toContain(dir1Name);
        expect(rootChildNames).toContain(file1Name);
        expect(dir1ChildNames).toContain(file2Name);
    });

    test('Storage correct mime types', async () => {
        let files = await addTestFiles();

        expect(files[0].mimeType).toMatch('application/json'); // All directories should be json files
        expect(files[1].mimeType).toMatch('application/octet-stream'); // Fallback since not given in addFile
        if (rootDirectory.constructor.preservesMimeType){
            expect(files[2].mimeType).toMatch('text/plain'); // As was defined in addFile
        }
    });

    test('Storage cannot add files or directories to non directory', async () => {
        let file1 = await rootDirectory.addFile(stringToArrayBuffer('jkl'), 'file', 'text/plain');
        let error;

        // Try to add a file to file1.
        error = null;
        try {
            await file1.addFile(stringToArrayBuffer('mno'), 'anotherFile', 'text/plain');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();

        // Try to add a directory to file1.
        error = null;
        try {
            await file1.addDirectory('directory');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
    });

    test('Storage cannot add wrong type', async () => {
        let error;

        // Test can't add Blob
        error = null;
        try {
            await rootDirectory.addFile(new Blob(['stu']), 'file', 'text/plain');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();

        // Test can't add plain string
        error = null;
        try {
            await rootDirectory.addFile('stu', 'file', 'text/plain');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
    });

    test('It can read files and directories', async () => {
        let files = await addTestFiles();

        let rootDirArrayBuffer = await rootDirectory.read();
        let dir1ArrayBuffer = await files[0].read();
        let file1ArrayBuffer = await files[1].read();
        let file2ArrayBuffer = await files[2].read();

        expect(rootDirArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(dir1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file2ArrayBuffer).toBeInstanceOf(ArrayBuffer);
    });

    test('Storage directories getChildren returns correct children', async () => {
        let files = await addTestFiles();
        let rootExpectedChildren = [files[0], files[1]];
        let dir1ExpectedChildren = [files[2]];

        // Directories getChildren method should return all children.
        let rootChildFiles = await rootDirectory.getChildren();
        let dir1ChildFiles = await files[0].getChildren();

        // Get the data from an instance of AbstractFile which should not change since it was added or
        // directly written to Directory size, lastModified, and url can change when child files are added.
        function staticDataFromFile(file){
            let staticData = {
                id: file.id,
                name: file.name,
                // created: file.created.toISOString(), //TODO this is variable on NodeFileStorage for some reason
                directory: file.directory,
                mimeType: file.mimeType
            };
            if (!file.directory){
                staticData.size = file.size;
                staticData.lastModified = file.lastModified.toISOString();
                staticData.url = file.url;
            }
            return staticData;
        }

        let rootExpectedStaticData = rootExpectedChildren.map(staticDataFromFile);
        let dir1ExpectedStaticData = dir1ExpectedChildren.map(staticDataFromFile);

        let rootFileNodesStaticData = rootChildFiles.map(staticDataFromFile);
        let dir1FileNodesStaticData = dir1ChildFiles.map(staticDataFromFile);

        expect(rootFileNodesStaticData.sort(compareById)).toEqual(rootExpectedStaticData.sort(compareById));
        expect(dir1FileNodesStaticData.sort(compareById)).toEqual(dir1ExpectedStaticData.sort(compareById));
    });

    test('Reading directory return json of FileData for all children', async () => {
        let files = await addTestFiles();

        // Check that when reading a directory you get a json string of FileData objects for each child and they
        // match those in getChildren
        let rootFileDataExpected = await listDirectoryDataFromGetChildren(rootDirectory);
        let dir1FileDataExpected = await listDirectoryDataFromGetChildren(files[0]);

        let rootChildFileData = await listDirectoryDataFromRead(rootDirectory);
        let dir1ChildFileData = await listDirectoryDataFromRead(files[0]);

        expect(rootChildFileData.sort(compareById)).toEqual(rootFileDataExpected.sort(compareById));
        expect(dir1ChildFileData.sort(compareById)).toEqual(dir1FileDataExpected.sort(compareById));
    });

    test('Storage file data is correct', async () => {
        let fileNodes = await addTestFiles();

        let file1ArrayBuffer = await fileNodes[1].read();
        let file2ArrayBuffer = await fileNodes[2].read();

        // File should have same data it was given.
        let file1Text = parseTextArrayBuffer(file1ArrayBuffer);
        let file2Text = parseTextArrayBuffer(file2ArrayBuffer);
        expect(file1Text).toMatch(file1String);
        expect(file2Text).toMatch(file2String);
    });

    test('It can delete files and directories', async () => {
        let files = await addTestFiles();

        await files[1].delete();
        let rootChildren = await listDirectoryDataFromGetChildren(rootDirectory);
        let rootChildNames = rootChildren.map((fileNode) => {return fileNode.name});
        expect(rootChildNames).not.toContain(file1Name);
        expect(rootChildNames).toContain(dir1Name);
    });

    test('It can rename files and directories', async () => {
        let files = await addTestFiles();

        await files[0].rename("dir1-new-name");
        await files[1].rename("file1-new-name");

        expect(files[0].name).toMatch("dir1-new-name");
        expect(files[1].name).toMatch("file1-new-name");

        let rootChildren = await listDirectoryDataFromGetChildren(rootDirectory);
        let rootChildNames = rootChildren.map((fileNode) => {return fileNode.name});
        expect(rootChildNames).toContain("dir1-new-name");
        expect(rootChildNames).toContain("file1-new-name");
        expect(rootChildNames).not.toContain(dir1Name);
        expect(rootChildNames).not.toContain(file1Name);
    });

    test('Ids are unique strings', async () => {
        let files = await addTestFiles();
        files.push(rootDirectory);

        let set = new Set();
        for (let file of files) {
            expect(typeof file.id).toBe('string');
            set.add(file.id);
        }

        expect(files.length).toBe(set.size);  // Check no duplicates, set will be smaller if so.
    });

    test('getFile method', async () => {
        let files = await addTestFiles();

        let dir1 = await rootDirectory.getFile([dir1Name]);
        let file2 = await rootDirectory.getFile([dir1Name, file2Name]);

        expect(dir1.id).toMatch(files[0].id);
        expect(file2.id).toMatch(files[2].id);
    });
}


describe('Test memory file storage', () => {
    let storage = new MemoryDirectory(null, 'root');

    beforeEach(() => {
        storage._children = [];
    });

    testStorage(storage);
});

global.window.indexedDB = IndexedDB;

describe('Test local file storage', () => {
    let storage = new LocalStorageRoot();

    beforeEach(async () => {
        await database.clearAll();
    });

    afterEach(async () => {
        // Make sure that the migrations have finished before moving to next.
        database.close();
    });

    testStorage(storage);
});

describe('Test virtual file storage', () => {
    let rootMounted = new MemoryDirectory(null, 'mounted');
    let storage = new VirtualRootDirectory(rootMounted);

    beforeEach(async () => {
      rootMounted._children = [];
      storage._mounts = {};
    });

    testStorage(storage);
});

describe('Test node file storage', () => {
  function rmDir(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((fileName, index) => {
        let subPath = path + '/' + fileName;
        if (fs.lstatSync(subPath).isDirectory()) {
          rmDir(subPath);
        } else {
          fs.unlinkSync(subPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

  let path = '/tmp/jestNodeStorageTest';
  rmDir(path);
  fs.mkdirSync(path);
  let storage = new NodeDirectory(path);

  beforeEach(async () => {
    rmDir(path);
    fs.mkdirSync(path);
  });

  testStorage(storage);
});