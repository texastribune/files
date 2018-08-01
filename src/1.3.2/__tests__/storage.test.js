/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryFileStorage} from "../js/files/storages/memory.js";
import {parseTextArrayBuffer, parseJsonArrayBuffer, stringToArrayBuffer, compareById} from "../js/utils.js";
import IndexedDB from "../../../node_modules/fake-indexeddb/build/index.js";
import {LocalStorageFileStorage} from "../js/files/storages/local.js";
import {NodeFileStorage} from "../js/files/storages/node.js";
import * as fs from 'fs';


async function listStorageDirectory(storage, fileNode) {
    let directoryArrayBuffer = await storage.readFileNode(fileNode.id);
    return parseJsonArrayBuffer(directoryArrayBuffer);
}

function testStorage(createStorage, tearDownStorage) {
    let storage;
    let file1String = 'abc';
    let file2String = 'def';
    let file1Name = 'file1';
    let file2Name = 'file2';
    let dir1Name = 'dir1';

    beforeEach(() => {
        storage = createStorage();
    });

    async function addTestFiles() {
        let rootFileNode = await storage.getRootFileNode();
        let dir1Node = await storage.addDirectory(rootFileNode.id, dir1Name);
        let file1Node = await storage.addFile(rootFileNode.id, stringToArrayBuffer(file1String), file1Name);
        let file2Node = await storage.addFile(dir1Node.id, stringToArrayBuffer(file2String), file2Name, 'text/plain');
        return [dir1Node, file1Node, file2Node];
    }

    test('Storage directories are files with json array string', async () => {
        let rootFileNode = await storage.getRootFileNode();
        let arrayBuffer = await storage.readFileNode(rootFileNode.id);
        let rootChildNodes = parseJsonArrayBuffer(arrayBuffer);
        expect(rootChildNodes).toBeInstanceOf(Array);
        expect(rootChildNodes.length).toEqual(0);
    });

    test('Storage can add files and directories', async () => {
        let fileNodes = await addTestFiles();
        let rootFileNode = await storage.getRootFileNode();
        let rootChildNodes = await listStorageDirectory(storage, rootFileNode);
        let dir1ChildNodes = await listStorageDirectory(storage, fileNodes[0]);

        let rootChildNames = rootChildNodes.map((fileNode) => {return fileNode.name});
        let dir1ChildNames = dir1ChildNodes.map((fileNode) => {return fileNode.name});

        expect(rootChildNames).toContain(dir1Name);
        expect(rootChildNames).toContain(file1Name);
        expect(dir1ChildNames).toContain(file2Name);
    });

    test('Storage correct mime types', async () => {
        let fileNodes = await addTestFiles();

        expect(fileNodes[0].mimeType).toMatch('application/json'); // All directories should be json files
        expect(fileNodes[1].mimeType).toMatch('application/octet-stream'); // Fallback since not given in addFile
        if (storage.constructor.preservesMimeType){
            expect(fileNodes[2].mimeType).toMatch('text/plain'); // As was defined in addFile
        }
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
        expect(error).not.toBeNull();

        // Try to add a directory to file1.
        error = null;
        try {
            await storage.addDirectory(file1Node.id, 'directory');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
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
        expect(error).not.toBeNull();

        // Test can't add plain string
        error = null;
        try {
            await storage.addFile(rootFileNode.id, 'stu', 'file', 'text/plain');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
    });

    test('It can read files and directories', async () => {
        let fileNodes = await addTestFiles();

        let rootFileNode = await storage.getRootFileNode();

        let rootDirArrayBuffer = await storage.readFileNode(rootFileNode.id);
        let dir1ArrayBuffer = await storage.readFileNode(fileNodes[0].id);
        let file1ArrayBuffer = await storage.readFileNode(fileNodes[1].id);
        let file2ArrayBuffer = await storage.readFileNode(fileNodes[2].id);

        expect(rootDirArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(dir1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file2ArrayBuffer).toBeInstanceOf(ArrayBuffer);
    });

    test('Storage directories contain correct child FileNodes', async () => {
        let fileNodes = await addTestFiles();
        let rootExpectedChildren = [fileNodes[0], fileNodes[1]];
        let dir1ExpectedChildren = [fileNodes[2]];

        let rootFileNode = await storage.getRootFileNode();

        let rootDirArrayBuffer = await storage.readFileNode(rootFileNode.id);
        let dir1ArrayBuffer = await storage.readFileNode(fileNodes[0].id);

        // Directories should be files containing json strings of arrays of file node data.
        let rootChildNodes = parseJsonArrayBuffer(rootDirArrayBuffer);
        let dir1ChildNodes = parseJsonArrayBuffer(dir1ArrayBuffer);

        // Get the FileNode data which should not change since it was added or directly written to
        // Directory size, lastModified, and url can change when child files are added.
        function staticData(fileNode){
            let staticData = {
                id: fileNode.id,
                name: fileNode.name,
                created: fileNode.created,
                directory: fileNode.directory,
                mimeType: fileNode.mimeType
            };
            if (!fileNode.directory){
                staticData.size = fileNode.size;
                staticData.lastModified = fileNode.lastModified;
                staticData.url = fileNode.url;
            }
            return staticData;
        }

        let rootFileNodesStaticData = rootChildNodes.map(staticData);
        let dir1FileNodesStaticData = dir1ChildNodes.map(staticData);

        let rootExpectedStaticData = rootExpectedChildren.map(staticData);
        let dir1ExpectedStaticData = dir1ExpectedChildren.map(staticData);

        expect(rootFileNodesStaticData.sort(compareById)).toEqual(rootExpectedStaticData.sort(compareById));
        expect(dir1FileNodesStaticData.sort(compareById)).toEqual(dir1ExpectedStaticData.sort(compareById));
    });

    test('Storage file data is correct', async () => {
        let fileNodes = await addTestFiles();

        let file1ArrayBuffer = await storage.readFileNode(fileNodes[1].id);
        let file2ArrayBuffer = await storage.readFileNode(fileNodes[2].id);

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
        let rootChildNodes = await listStorageDirectory(storage, rootFileNode);
        let rootChildNames = rootChildNodes.map((fileNode) => {return fileNode.name});
        expect(rootChildNames).not.toContain(file1Name);
        expect(rootChildNames).toContain(dir1Name);
    });
}


describe('Test memory file storage', () => {
    testStorage(() => {
        return new MemoryFileStorage();
    })
});

global.window.indexedDB = IndexedDB;

describe('Test local file storage', () => {
    let storage;

    testStorage(() => {
        global.window.indexedDB._databases.clear();
        storage = new LocalStorageFileStorage();
        return storage;
    });

    afterEach(async () => {
        // Make sure that the migrations have finished before moving to next.
        await storage._dbPromise;
    })
});

describe('Test node file storage', () => {
    testStorage(() => {
        let path = '/tmp/jestNodeStorageTest';

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

        rmDir(path);
        fs.mkdirSync(path);
        return new NodeFileStorage(path);
    })
});