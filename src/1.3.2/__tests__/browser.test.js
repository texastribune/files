/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryDirectory} from "../js/files/memory.js";
import {FileBrowser} from "../js/ui/browser.js";
import {Table, Column} from "../js/ui/table.js";
import {stringToArrayBuffer} from "../js/utils.js";
import {StateMixin} from "../js/files/mixins/state.js";

const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';

const file1Text = 'abc';
const file2Text = 'def';

async function addTestFiles(rootDirectory){
  let dir1FileObject = await rootDirectory.addDirectory([], dir1Name);
  let file1FileObject = await rootDirectory.addFile([], stringToArrayBuffer(file1Text),
                                             file1Name, 'text/plain');
  let file2FileObject = await rootDirectory.addFile([dir1Name], stringToArrayBuffer(file2Text),
                                             file2Name, 'text/plain');
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
    table = new Table();
    browser = new FileBrowser(rootDirectory, table);
  });

  test('Table has files', async () => {
    let fileObjects = await addTestFiles(rootDirectory);
    await browser.goTo([], true);

    let rowData = {};
    for (let row of table.rows){
      rowData[row.data.name] = row.data;
    }

    expect(table.rows.length).toEqual(2);
    expect(rowData).toHaveProperty(dir1Name);
    expect(rowData).toHaveProperty(file1Name);
  });
});
