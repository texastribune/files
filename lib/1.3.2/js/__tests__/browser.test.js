"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("../files/memory");
const browser_1 = require("../ui/browser");
const utils_1 = require("../utils");
const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';
const file1Text = 'abc';
const file2Text = 'def';
function addTestFiles(rootDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        let dir1FileObject = yield rootDirectory.addDirectory(dir1Name);
        let file1FileObject = yield rootDirectory.addFile(utils_1.stringToArrayBuffer(file1Text), file1Name, 'text/plain');
        let file2FileObject = yield dir1FileObject.addFile(utils_1.stringToArrayBuffer(file2Text), file2Name, 'text/plain');
        return [dir1FileObject, file1FileObject, file2FileObject];
    });
}
class MockMutationObserver {
    constructor(callback) {
        // Do nothing
    }
    observe(target, options) {
        // Do nothing
    }
    disconnect() {
        // Do nothing
    }
    takeRecords() {
        return [];
    }
}
global["MutationObserver"] = MockMutationObserver;
describe('Test browser', () => {
    let rootDirectory;
    let table;
    let browser;
    beforeEach(() => {
        rootDirectory = new memory_1.MemoryDirectory(null, 'root');
        browser = new browser_1.FileBrowser(rootDirectory);
    });
    test('Table has files', () => __awaiter(this, void 0, void 0, function* () {
        let fileObjects = yield addTestFiles(rootDirectory);
        yield browser.setPath([]);
        let rowData = {};
        for (let row of browser.table.rows) {
            rowData[row.data.name] = row.data;
        }
        expect(browser.table.rows.length).toEqual(2);
        expect(rowData).toHaveProperty(dir1Name);
        expect(rowData).toHaveProperty(file1Name);
        yield browser.setPath([dir1Name]);
        rowData = {};
        for (let row of browser.table.rows) {
            rowData[row.data.name] = row.data;
        }
        expect(browser.table.rows.length).toEqual(1);
        expect(rowData).toHaveProperty(file2Name);
    }));
});
