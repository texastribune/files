/* eslint-disable import/first */
/* global jest, test, expect, describe */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MemoryDirectory } from "../files/memory";
import { parseTextArrayBuffer, stringToArrayBuffer } from "../utils";
import IndexedDB from "fake-indexeddb/build/index";
import { LocalStorageRoot, database } from "../files/local";
import { VirtualFS } from "../files/virtual";
import { BasicFile, FileAlreadyExistsError, FileNotFoundError } from "../files/base";
import { NodeDirectory } from "../files/node";
import { CachedProxyDirectory } from "../files/proxy";
function compareById(a, b) {
    if (a.id > b.id) {
        return 1;
    }
    if (a.id < b.id) {
        return -1;
    }
    return 0;
}
function listDirectoryDataFromRead(directory) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield directory.readJSON();
    });
}
function listDirectoryDataFromGetChildren(directory) {
    return __awaiter(this, void 0, void 0, function* () {
        let children = yield directory.getChildren();
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
    });
}
function testStorage(rootDirectory) {
    let file1String = 'abc';
    let file2String = 'def';
    let file1Name = 'file1';
    let file2Name = 'file2';
    let dir1Name = 'dir1';
    function addTestFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            let dir1 = yield rootDirectory.addDirectory(dir1Name);
            let file1 = yield rootDirectory.addFile(stringToArrayBuffer(file1String), file1Name);
            let file2 = yield dir1.addFile(stringToArrayBuffer(file2String), file2Name, 'text/plain');
            return [dir1, file1, file2];
        });
    }
    function removeTestFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let child of yield rootDirectory.getChildren()) {
                yield child.delete();
            }
        });
    }
    afterEach(removeTestFiles);
    test('Directories are files with json array string', () => __awaiter(this, void 0, void 0, function* () {
        expect(rootDirectory).toBeInstanceOf(BasicFile);
        let childData = yield rootDirectory.readJSON();
        if (childData instanceof Array) {
            expect(childData.length).toEqual(0);
        }
        else {
            throw new Error('directory data is not an array');
        }
    }));
    test('Storage can add files and directories', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        let rootChildFiles = yield rootDirectory.getChildren();
        let dir1ChildFiles = yield files[0].getChildren();
        expect(rootChildFiles[0].directory).toBe(true);
        expect(rootChildFiles[1].directory).toBe(false);
        let rootChildNames = rootChildFiles.map((file) => { return file.name; });
        let dir1ChildNames = dir1ChildFiles.map((file) => { return file.name; });
        expect(rootChildNames).toContain(dir1Name);
        expect(rootChildNames).toContain(file1Name);
        expect(dir1ChildNames).toContain(file2Name);
    }));
    test('Storage cannot add files with same name', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        let caughtError = null;
        yield rootDirectory.addFile(stringToArrayBuffer('same name as file 1'), file1Name)
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileAlreadyExistsError);
    }));
    test('Storage correct mime types', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
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
    }));
    test('It can read files and directories', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        let rootDirArrayBuffer = yield rootDirectory.read();
        let dir1ArrayBuffer = yield files[0].read();
        let file1ArrayBuffer = yield files[1].read();
        let file2ArrayBuffer = yield files[2].read();
        expect(rootDirArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(dir1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file1ArrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(file2ArrayBuffer).toBeInstanceOf(ArrayBuffer);
    }));
    test('Storage directories getChildren returns correct children', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        // Directories getChildren method should return all children.
        let rootChildFiles = yield rootDirectory.getChildren();
        let rootChildFileMap = rootChildFiles.reduce((map, file) => {
            map[file.name] = file;
            return map;
        }, {});
        let dir1ChildFiles = yield files[0].getChildren();
        // Get the data from an instance of AbstractFile which should not change since it was added or
        // directly written to Directory size, lastModified, and url can change when child files are added.
        function areFilesSame(file1, file2) {
            return file1.id === file2.id && file1.name === file2.name && file1.directory === file2.directory;
        }
        expect(rootChildFiles.length).toEqual(2);
        expect(areFilesSame(rootChildFileMap[files[0].name], files[0])).toBeTruthy();
        expect(areFilesSame(rootChildFileMap[files[1].name], files[1])).toBeTruthy();
        expect(areFilesSame(dir1ChildFiles[0], files[2])).toBeTruthy();
    }));
    test('Reading directory return json of FileData for all children', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        // Check that when reading a directory you get a json string of FileData objects for each child and they
        // match those in getChildren
        let rootFileDataExpected = yield listDirectoryDataFromGetChildren(rootDirectory);
        let dir1FileDataExpected = yield listDirectoryDataFromGetChildren(files[0]);
        let rootChildFileData = yield listDirectoryDataFromRead(rootDirectory);
        let dir1ChildFileData = yield listDirectoryDataFromRead(files[0]);
        expect(rootChildFileData.sort(compareById)).toEqual(rootFileDataExpected.sort(compareById));
        expect(dir1ChildFileData.sort(compareById)).toEqual(dir1FileDataExpected.sort(compareById));
    }));
    test('Storage file data is correct', () => __awaiter(this, void 0, void 0, function* () {
        let fileNodes = yield addTestFiles();
        let file1ArrayBuffer = yield fileNodes[1].read();
        let file2ArrayBuffer = yield fileNodes[2].read();
        // File should have same data it was given.
        let file1Text = parseTextArrayBuffer(file1ArrayBuffer);
        let file2Text = parseTextArrayBuffer(file2ArrayBuffer);
        expect(file1Text).toMatch(file1String);
        expect(file2Text).toMatch(file2String);
    }));
    test('It can delete files and directories', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        yield files[1].delete();
        let rootChildren = yield rootDirectory.getChildren();
        let rootChildNames = rootChildren.map((file) => { return file.name; });
        expect(rootChildNames).not.toContain(file1Name);
        expect(rootChildNames).toContain(dir1Name);
    }));
    test('It can rename files and directories', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        yield files[0].rename("dir1-new-name");
        yield files[1].rename("file1-new-name");
        expect(files[0].name).toMatch("dir1-new-name");
        expect(files[1].name).toMatch("file1-new-name");
        let rootChildren = yield listDirectoryDataFromGetChildren(rootDirectory);
        let rootChildNames = rootChildren.map((fileNode) => { return fileNode.name; });
        expect(rootChildNames).toContain("dir1-new-name");
        expect(rootChildNames).toContain("file1-new-name");
        expect(rootChildNames).not.toContain(dir1Name);
        expect(rootChildNames).not.toContain(file1Name);
    }));
    test('Ids are unique strings', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        files.push(rootDirectory);
        let set = new Set();
        for (let file of files) {
            expect(typeof file.id).toBe('string');
            set.add(file.id);
        }
        expect(files.length).toBe(set.size); // Check no duplicates, set will be smaller if so.
    }));
    test('getFile method', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        let dir1 = yield rootDirectory.getFile([dir1Name]);
        let file2 = yield rootDirectory.getFile([dir1Name, file2Name]);
        expect(dir1.id).toMatch(files[0].id);
        expect(file2.id).toMatch(files[2].id);
        let caughtError = null;
        yield rootDirectory.getFile(["badname"])
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileNotFoundError);
        caughtError = null;
        yield rootDirectory.getFile([dir1Name, "badname"])
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileNotFoundError);
    }));
    test('move method', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        let file2 = yield rootDirectory.getFile([dir1Name, file2Name]);
        yield file2.move(rootDirectory);
        let movedFile2 = yield rootDirectory.getFile([file2Name]);
        let data = yield movedFile2.read();
        expect(parseTextArrayBuffer(data)).toEqual(file2String);
        let caughtError = null;
        yield rootDirectory.getFile([dir1Name, file2Name])
            .catch((error) => {
            caughtError = error;
        });
        expect(caughtError).toBeInstanceOf(FileNotFoundError);
    }));
    test('copy method', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        let file2 = yield rootDirectory.getFile([dir1Name, file2Name]);
        yield file2.copy(rootDirectory);
        let copy = yield rootDirectory.getFile([file2Name]);
        let data = yield copy.read();
        let existing = yield rootDirectory.getFile([dir1Name, file2Name]);
        expect(copy.id).not.toEqual(existing.id);
        expect(copy.name).toEqual(existing.name);
        expect(parseTextArrayBuffer(data)).toEqual(file2String);
    }));
    test('search method', () => __awaiter(this, void 0, void 0, function* () {
        let files = yield addTestFiles();
        let results = yield files[0].search(file2Name);
        expect(results).toHaveLength(1);
        expect(results[0].file.name).toMatch(file2Name);
        expect(results[0].path).toHaveLength(1);
        expect(results[0].path[0]).toMatch(file2Name);
    }));
    test('change listener', () => __awaiter(this, void 0, void 0, function* () {
        // Expect change listeners to be called at least once for each file change.
        // Can be called more than once
        let files = yield addTestFiles();
        let dir1 = files[0];
        let file1 = yield rootDirectory.getFile([file1Name]);
        let file2 = yield rootDirectory.getFile([dir1Name, file2Name]);
        let calls = {
            dir1: 0,
            file1: 0,
            file2: 0,
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
        dir1.addOnChangeListener(dir1Listener);
        file1.addOnChangeListener(file1Listener);
        file2.addOnChangeListener(file2Listener);
        // write should trigger call change listener only on file1 because it has no parent directory
        yield file1.write(stringToArrayBuffer("change"));
        expect(calls.dir1).toEqual(0);
        expect(calls.file1).toBeGreaterThanOrEqual(1);
        expect(calls.file2).toEqual(0);
        // reset counts
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // write should trigger call change listener on file and parent directory
        yield file2.write(stringToArrayBuffer("change2"));
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toBeGreaterThanOrEqual(1);
        // reset counts
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // rename should trigger call change listener on file and parent directory
        yield file2.rename("new name");
        if (!(dir1 instanceof NodeDirectory)) {
            // Node fs.watch is not catching this
            expect(calls.dir1).toBeGreaterThanOrEqual(1);
        }
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toBeGreaterThanOrEqual(1);
        // reset counts
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // add should trigger call change listener on parent directory only
        yield dir1.addFile(new ArrayBuffer(0), 'added-file', 'text/plain');
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toEqual(0);
        // reset counts
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // delete should trigger call change listener on parent directory/may or may not on file itself
        yield file2.delete();
        expect(calls.dir1).toBeGreaterThanOrEqual(1);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toBeLessThanOrEqual(1);
        // reset counts
        calls.dir1 = 0;
        calls.file1 = 0;
        calls.file2 = 0;
        // If we remove listeners, no calls should happen
        dir1.removeOnChangeListener(dir1Listener);
        file1.removeOnChangeListener(file1Listener);
        file2.removeOnChangeListener(file2Listener);
        yield file1.write(stringToArrayBuffer("change2"));
        yield dir1.rename("new name");
        expect(calls.dir1).toBeGreaterThanOrEqual(0);
        expect(calls.file1).toEqual(0);
        expect(calls.file2).toEqual(0);
    }));
}
describe('Test memory file storage', () => {
    let storage = new MemoryDirectory(null, 'root');
    testStorage(storage);
});
global.window.indexedDB = IndexedDB;
describe('Test local file storage', () => {
    let storage = new LocalStorageRoot();
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield database.clearAll();
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        // Make sure that the migrations have finished before moving to next.
        yield database.close();
    }));
    testStorage(storage);
});
describe('Test virtual file storage', () => {
    let rootMounted = new MemoryDirectory(null, 'mounted');
    let storage = new VirtualFS(rootMounted);
    testStorage(storage);
});
describe('Test cached proxy file storage', () => {
    let rootMounted = new MemoryDirectory(null, 'mounted');
    let storage = new CachedProxyDirectory(rootMounted);
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
