/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryDirectory} from "../js/files/memory.js";
import {FileBrowser} from "../js/ui/browser.js";
import {Table, Column} from "../js/ui/table.js";
import {stringToArrayBuffer} from "../js/utils";
import {StateMixin} from "../js/files/mixins/state.js";

const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';

const file1Text = 'abc';
const file2Text = 'def';

async function addTestFiles(system){
  let dir1FileObject = await system.addDirectory([], dir1Name);
  let file1FileObject = await system.addFile([], stringToArrayBuffer(file1Text),
                                             file1Name, 'text/plain');
  let file2FileObject = await system.addFile([dir1Name], stringToArrayBuffer(file2Text),
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
  let system;
  let table;
  let browser;

  beforeEach(() => {
    let DirectoryClass = StateMixin(MemoryDirectory);
    rootDirectory = new DirectoryClass(null, 'root');
    table = new Table();
    browser = new FileBrowser(rootDirectory, table);
  });

  test('Table has files', async () => {
    let fileObjects = await addTestFiles(system);
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
