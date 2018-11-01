/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryDirectory} from "../js/files/memory.js";
import {parseTextArrayBuffer, parseJsonArrayBuffer, stringToArrayBuffer, compareById} from "../js/utils.js";
import IndexedDB from "../../../node_modules/fake-indexeddb/build/index.js";
import {LocalStorageRoot} from "../js/files/local.js";
import {NodeFileStorage} from "../js/files/storages/node.js";
import {AbstractDirectory, AbstractFile} from "../js/files/base.js";


async function listDirectoryData(directory) {
    let directoryArrayBuffer = await directory.read();
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
        let dir1Node = await storage.addDirectory(dir1Name);
        let file1Node = await storage.addFile(stringToArrayBuffer(file1String), file1Name);
        let file2Node = await storage.addFile(stringToArrayBuffer(file2String), file2Name, 'text/plain');
        return [dir1Node, file1Node, file2Node];
    }

    test('Storage directories are files with json array string', async () => {
        let arrayBuffer = await storage.read();
        let rootChildNodes = parseJsonArrayBuffer(arrayBuffer);
        expect(rootChildNodes).toBeInstanceOf(Array);
        expect(rootChildNodes.length).toEqual(0);
    });

    test('Storage can add files and directories', async () => {
        let files = await addTestFiles();
        let rootChildFiles = await listDirectoryData(storage);
        let dir1ChildFiles = await listDirectoryData(files[0]);

        expect(rootChildFiles[0]).toBeInstanceOf(AbstractDirectory);
        expect(rootChildFiles[1]).toBeInstanceOf(AbstractFile);

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
        if (storage.constructor.preservesMimeType){
            expect(files[2].mimeType).toMatch('text/plain'); // As was defined in addFile
        }
    });

    test('Storage cannot add files or directories to non directory', async () => {
        let file1 = await storage.addFile(stringToArrayBuffer('jkl'), 'file', 'text/plain');
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
            await storage.addFile(new Blob(['stu']), 'file', 'text/plain');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();

        // Test can't add plain string
        error = null;
        try {
            await storage.addFile('stu', 'file', 'text/plain');
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();
    });

    test('It can read files and directories', async () => {
        let files = await addTestFiles();

        let rootDirArrayBuffer = await storage.read();
        let dir1ArrayBuffer = await files[0].read();
        let file1ArrayBuffer = await files[1].read();
        let file2ArrayBuffer = await files[2].read();

        expect(rootDirArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(dir1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file2ArrayBuffer).toBeInstanceOf(ArrayBuffer);
    });

    test('Storage directories contain correct child FileNodes', async () => {
        let files = await addTestFiles();
        let rootExpectedChildren = [files[0], files[1]];
        let dir1ExpectedChildren = [files[2]];

        let rootDirArrayBuffer = await storage.read();
        let dir1ArrayBuffer = await files[0].read();

        // Directories should be files containing json strings of arrays of file node data.
        let rootChildNodes = parseJsonArrayBuffer(rootDirArrayBuffer);
        let dir1ChildNodes = parseJsonArrayBuffer(dir1ArrayBuffer);

        // Get the FileNode data which should not change since it was added or directly written to
        // Directory size, lastModified, and url can change when child files are added.
        function staticData(file){
            let staticData = {
                id: file.id,
                name: file.name,
                // created: file.created, //TODO this is variable on NodeFileStorage for some reason
                directory: file.directory,
                mimeType: file.mimeType
            };
            if (!file.directory){
                staticData.size = file.size;
                staticData.lastModified = file.lastModified;
                staticData.url = file.url;
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

        let file1ArrayBuffer = await fileNodes[1].read();
        let file2ArrayBuffer = await fileNodes[2].read();

        // File should have same data it was given.
        let file1Text = parseTextArrayBuffer(file1ArrayBuffer);
        let file2Text = parseTextArrayBuffer(file2ArrayBuffer);
        expect(file1Text).toMatch(file1String);
        expect(file2Text).toMatch(file2String);
    });

    test('It can delete files and directories', async () => {
        let fileNodes = await addTestFiles();

        await storage.delete(fileNodes[1].id);
        let rootChildNodes = await listDirectoryData(storage, rootFileNode);
        let rootChildNames = rootChildNodes.map((fileNode) => {return fileNode.name});
        expect(rootChildNames).not.toContain(file1Name);
        expect(rootChildNames).toContain(dir1Name);
    });
}


describe('Test memory file storage', () => {
    testStorage(() => {
        return new MemoryDirectory(null, 'root');
    })
});

global.window.indexedDB = IndexedDB;

describe('Test local file storage', () => {
    let storage;

    testStorage(() => {
        global.window.indexedDB._databases.clear();
        storage = new LocalStorageRoot();
        return storage;
    });

    afterEach(async () => {
        // Make sure that the migrations have finished before moving to next.
        await storage._dbPromise;
    })
});

// describe('Test node file storage', () => {
//     testStorage(() => {
//         let path = '/tmp/jestNodeStorageTest';
//
//         function rmDir(path) {
//             if (fs.existsSync(path)) {
//                 fs.readdirSync(path).forEach((fileName, index) => {
//                     let subPath = path + '/' + fileName;
//                     if (fs.lstatSync(subPath).isDirectory()) {
//                         rmDir(subPath);
//                     } else {
//                         fs.unlinkSync(subPath);
//                     }
//                 });
//                 fs.rmdirSync(path);
//             }
//         }
//
//         rmDir(path);
//         fs.mkdirSync(path);
//         return new NodeFileStorage(path);
//     })
// });