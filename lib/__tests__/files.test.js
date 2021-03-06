/* eslint-disable import/first */
/* global jest, test, expect, describe */
import { MemoryDirectory } from "../files/memory";
import { parseTextArrayBuffer, stringToArrayBuffer } from "../utils";
import IndexedDB from "fake-indexeddb/build/index";
import { LocalStorageRoot, database } from "../files/local";
import { VirtualFS } from "../files/virtual";
import { BasicFile, FileAlreadyExistsError, FileNotFoundError } from "../files/base";
import { NodeDirectory } from "../files/node";
import { CachedProxyRootDirectory } from "../files/proxy";
import { RemoteFS } from "../files/remote.js";
import { MockBackendDirectory, MockRemoteRequester } from "../testUtils.js";
function compareById(a, b) {
    if (a.id > b.id) {
        return 1;
    }
    if (a.id < b.id) {
        return -1;
    }
    return 0;
}
async function listDirectoryDataFromRead(directory) {
    return await directory.readJSON();
}
async function listDirectoryDataFromGetChildren(directory) {
    let children = await directory.getChildren();
    let dataArray = [];
    for (let file of children) {
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
    async function removeTestFiles() {
        for (let child of await rootDirectory.getChildren()) {
            await child.delete();
        }
    }
    afterEach(removeTestFiles);
    test('Directories are files with json array string', async () => {
        expect(rootDirectory).toBeInstanceOf(BasicFile);
        let childData = await rootDirectory.readJSON();
        if (!(childData instanceof Array)) {
            throw new Error('directory data is not an array');
        }
    });
    test('Storage can add files and directories', async () => {
        let files = await addTestFiles();
        let rootChildFiles = await rootDirectory.getChildren();
        let dir1ChildFiles = await files[0].getChildren();
        expect(rootChildFiles[0].directory).toBe(true);
        expect(rootChildFiles[1].directory).toBe(false);
        let rootChildNames = rootChildFiles.map((file) => { return file.name; });
        let dir1ChildNames = dir1ChildFiles.map((file) => { return file.name; });
        expect(rootChildNames).toContain(dir1Name);
        expect(rootChildNames).toContain(file1Name);
        expect(dir1ChildNames).toContain(file2Name);
    });
    test('Storage cannot add files with same name', async () => {
        let files = await addTestFiles();
        let caughtError = null;
        await rootDirectory.addFile(stringToArrayBuffer('same name as file 1'), file1Name)
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileAlreadyExistsError);
    });
    test('Storage correct mime types', async () => {
        let files = await addTestFiles();
        expect(files[0].mimeType).toMatch('application/json'); // All directories should be json files
        expect(files[1].mimeType).toMatch('application/octet-stream'); // Fallback since not given in addFile
        if (rootDirectory instanceof NodeDirectory) {
            // Node.js file API does not have a way to store mime type
            console.log("NodeDirectory does not preserve metdata");
            expect(files[2].mimeType).toMatch('application/octet-stream');
        }
        else {
            // As was defined in addFile
            expect(files[2].mimeType).toMatch('text/plain');
        }
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
        // Directories getChildren method should return all children.
        let rootChildFiles = await rootDirectory.getChildren();
        let rootChildFileMap = rootChildFiles.reduce((map, file) => {
            map[file.name] = file;
            return map;
        }, {});
        let dir1ChildFiles = await files[0].getChildren();
        let dir1ChildFileMap = dir1ChildFiles.reduce((map, file) => {
            map[file.name] = file;
            return map;
        }, {});
        // Get the data from an instance of AbstractFile which should not change since it was added or
        // directly written to Directory size, lastModified, and url can change when child files are added.
        function areFilesSame(file1, file2) {
            return file1.id === file2.id && file1.name === file2.name && file1.directory === file2.directory;
        }
        expect(areFilesSame(rootChildFileMap[files[0].name], files[0])).toBeTruthy();
        expect(areFilesSame(rootChildFileMap[files[1].name], files[1])).toBeTruthy();
        expect(areFilesSame(dir1ChildFileMap[files[2].name], files[2])).toBeTruthy();
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
        let rootChildren = await rootDirectory.getChildren();
        let rootChildNames = rootChildren.map((file) => { return file.name; });
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
        let rootChildNames = rootChildren.map((fileNode) => { return fileNode.name; });
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
        expect(files.length).toBe(set.size); // Check no duplicates, set will be smaller if so.
    });
    test('getFile method', async () => {
        let files = await addTestFiles();
        let dir1 = await rootDirectory.getFile([dir1Name]);
        let file2 = await rootDirectory.getFile([dir1Name, file2Name]);
        expect(dir1.id).toMatch(files[0].id);
        expect(file2.id).toMatch(files[2].id);
        let caughtError = null;
        await rootDirectory.getFile(["badname"])
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileNotFoundError);
        caughtError = null;
        await rootDirectory.getFile([dir1Name, "badname"])
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileNotFoundError);
    });
    test('move method', async () => {
        let files = await addTestFiles();
        let file2 = await rootDirectory.getFile([dir1Name, file2Name]);
        await file2.move(rootDirectory);
        let movedFile2 = await rootDirectory.getFile([file2Name]);
        let data = await movedFile2.read();
        expect(parseTextArrayBuffer(data)).toEqual(file2String);
        let caughtError = null;
        await rootDirectory.getFile([dir1Name, file2Name])
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileNotFoundError);
    });
    test('copy method', async () => {
        let files = await addTestFiles();
        let file2 = await rootDirectory.getFile([dir1Name, file2Name]);
        await file2.copy(rootDirectory);
        let copy = await rootDirectory.getFile([file2Name]);
        let data = await copy.read();
        let existing = await rootDirectory.getFile([dir1Name, file2Name]);
        expect(copy.id).not.toEqual(existing.id);
        expect(copy.name).toEqual(existing.name);
        expect(parseTextArrayBuffer(data)).toEqual(file2String);
    });
    test('search method', async () => {
        let files = await addTestFiles();
        let results = await files[0].search(file2Name);
        expect(results).toHaveLength(1);
        expect(results[0].file.name).toMatch(file2Name);
        expect(results[0].path).toHaveLength(1);
        expect(results[0].path[0]).toMatch(file2Name);
    });
    test('change listener', async () => {
        // Expect change listeners to be called at least once for each file change.
        // Can be called more than once
        let files = await addTestFiles();
        let dir1 = files[0];
        let file1 = await rootDirectory.getFile([file1Name]);
        let file2 = await rootDirectory.getFile([dir1Name, file2Name]);
        let calls = {
            root: 0,
            dir1: 0,
            file1: 0,
            file2: 0,
        };
        let rootListener = (file) => {
            expect(file.id).toEqual(rootDirectory.id);
            calls.root++;
        };
        let dir1Listener = (file) => {
            expect(file.id).toEqual(dir1.id);
            calls.dir1++;
        };
        let file1Listener = (file) => {
            expect(file.id).toEqual(file1.id);
            calls.file1++;
        };
        let file2Listener = (file) => {
            expect(file.id).toEqual(file2.id);
            calls.file2++;
        };
        // add change listeners for each file that increment the count when called
        rootDirectory.addOnChangeListener(rootListener);
        dir1.addOnChangeListener(dir1Listener);
        file1.addOnChangeListener(file1Listener);
        file2.addOnChangeListener(file2Listener);
        // write should trigger call change listener only on file1 and root directory
        await file1.write(stringToArrayBuffer("change"));
        expect(calls.root).toBeGreaterThanOrEqual(1);
        expect(calls.dir1).toEqual(0);
        expect(calls.file1).toBeGreaterThanOrEqual(1);
        expect(calls.file2).toEqual(0);
        // reset counts
        calls.root = 0;
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // write should trigger call change listener on file and parent directory
        await file2.write(stringToArrayBuffer("change2"));
        expect(calls.root).toBeGreaterThanOrEqual(1);
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toBeGreaterThanOrEqual(1);
        // reset counts
        calls.root = 0;
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // rename should trigger call change listener on file and parent directory
        await file2.rename("new name");
        expect(calls.root).toBeGreaterThanOrEqual(1);
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toBeGreaterThanOrEqual(1);
        // reset counts
        calls.root = 0;
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // add should trigger call change listener on parent directories only
        await dir1.addFile(new ArrayBuffer(0), 'added-file', 'text/plain');
        expect(calls.root).toBeGreaterThanOrEqual(1);
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toEqual(0);
        // reset counts
        calls.root = 0;
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // delete should trigger call change listener on parent directory/may or may not on file itself
        await file2.delete();
        expect(calls.root).toBeGreaterThanOrEqual(1);
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toBeLessThanOrEqual(1);
        // TODO should it trigger after it's been deleted. Probably not on parents, so need to add test.
        // reset counts
        calls.root = 0;
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // If we remove listeners, no calls should happen
        rootDirectory.removeOnChangeListener(rootListener);
        dir1.removeOnChangeListener(dir1Listener);
        file1.removeOnChangeListener(file1Listener);
        file2.removeOnChangeListener(file2Listener);
        await file1.write(stringToArrayBuffer("change2"));
        await dir1.rename("new name");
        expect(calls.root).toBeGreaterThanOrEqual(0);
        expect(calls.dir1).toBeGreaterThanOrEqual(0);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toEqual(0);
    });
}
describe('Test memory file storage', () => {
    let storage = new MemoryDirectory(null, 'root');
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
        await database.close();
    });
    testStorage(storage);
});
describe('Test virtual file storage', () => {
    let rootMounted = new MemoryDirectory(null, 'mounted');
    let storage = new VirtualFS(rootMounted);
    testStorage(storage);
});
describe('Test cached proxy file storage', () => {
    let rootMounted = new MemoryDirectory(null, 'mounted');
    let storage = new CachedProxyRootDirectory(rootMounted);
    testStorage(storage);
});
describe('Test remote file storage', () => {
    let root = new MockBackendDirectory(null, "root");
    let storage = new RemoteFS("root", "http://api.com", root.id, new MockRemoteRequester(root));
    testStorage(storage);
});
// TODO NodeJS tests have issues with fs.watcher causing JEST to hang.
// describe('Test node file storage', () => {
//   function rmDir(path : string) {
//     if (fs.existsSync(path)) {
//       fs.readdirSync(path).forEach((fileName, index) => {
//         let subPath = path + '/' + fileName;
//         if (fs.lstatSync(subPath).isDirectory()) {
//           rmDir(subPath);
//         } else {
//           fs.unlinkSync(subPath);
//         }
//       });
//       fs.rmdirSync(path);
//     }
//   }
//
//   let path = '/tmp/jestNodeStorageTest';
//   rmDir(path);
//   fs.mkdirSync(path);
//   let storage = new NodeDirectory(path);
//
//   testStorage(storage);
//
//   afterAll(async () => {
//       await storage.delete();
//   })
// });
describe('Test directory caching', () => {
    class TestDirectory extends MemoryDirectory {
        constructor() {
            super(...arguments);
            this.callCount = 0;
        }
        async getFile(pathArray) {
            this.callCount++;
            return super.getFile(pathArray);
        }
        async getChildren() {
            this.callCount++;
            return super.getChildren();
        }
    }
    test('new directories cached', async () => {
        let root = new TestDirectory(null, "root");
        let rootCache = new CachedProxyRootDirectory(root);
        let dir1 = await rootCache.addDirectory("test1");
        let dir2 = await rootCache.addDirectory("test2");
        let children = await rootCache.getChildren();
        expect(children.length).toEqual(2);
        expect(root.callCount).toEqual(1); // Nothing should be cached the first time.
        // Reset call count
        root.callCount = 0;
        children = await rootCache.getChildren();
        expect(children.length).toEqual(2);
        expect(root.callCount).toEqual(0); // Should be cached the second time.
        let file = await rootCache.getFile([dir1.name]);
        expect(file.name).toEqual(dir1.name);
        expect(root.callCount).toEqual(0); // Child should be cached now
    });
});
