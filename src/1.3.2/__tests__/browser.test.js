/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryDirectory} from "../js/files/memory.ts";
import {FileBrowser} from "../js/ui/browser.js";
import {Table, Column} from "../js/ui/table.js";
import {stringToArrayBuffer} from "../js/utils.ts";
import {StateMixin} from "../js/files/mixins/state.js";

const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';

const file1Text = 'abc';
const file2Text = 'def';

async function addTestFiles(rootDirectory){
  let dir1FileObject = await rootDirectory.addDirectory(dir1Name);
  let file1FileObject = await rootDirectory.addFile(stringToArrayBuffer(file1Text),
                                                    file1Name,
                                                    'text/plain');
  let file2FileObject = await dir1FileObject.addFile(stringToArrayBuffer(file2Text),
                                                    file2Name,
                                                    'text/plain');
  return [dir1FileObject, file1FileObject, file2FileObject];
}

class MutationObserver {
  constructor(...args){
    // Do nothing
  }
  observe(...args){
    // Do nothing
  }
}

global.MutationObserver = MutationObserver;


describe('Test browser', () => {
  let rootDirectory;
  let table;
  let browser;

  beforeEach(() => {
    rootDirectory = new MemoryDirectory(null, 'root');
    browser = new FileBrowser(rootDirectory,);
  });

  test('Table has files', async () => {
    let fileObjects = await addTestFiles(rootDirectory);
    await browser.setPath([]);

    let rowData = {};
    for (let row of browser.table.rows){
      rowData[row.data.name] = row.data;
    }

    expect(browser.table.rows.length).toEqual(2);
    expect(rowData).toHaveProperty(dir1Name);
    expect(rowData).toHaveProperty(file1Name);

    await browser.setPath([dir1Name]);

    rowData = {};
    for (let row of browser.table.rows){
        rowData[row.data.name] = row.data;
    }

    expect(browser.table.rows.length).toEqual(1);
    expect(rowData).toHaveProperty(file2Name);
  });
});
