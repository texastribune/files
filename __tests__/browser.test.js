/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryFileStorage} from "../v1.3/js/files/storages/memory.js";
import {BaseFileSystem, StateMixin} from "../v1.3/js/files/systems.js";
import {FileBrowser} from "../v1.3/js/ui/browser.js";
import {Table, Column} from "../v1.3/js/ui/table.js";

const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';

const file1Text = 'abc';
const file2Text = 'def';

async function addTestFiles(system){
  let file1 = new File([file1Text], file1Name, {type: 'text/plain'});
  let file2 = new File([file2Text], file2Name, {type: 'text/plain'});
  let dir1FileObject = await system.addDirectory([], dir1Name);
  let file1FileObject = await system.addFile([], file1, file1Name);
  let file2FileObject = await system.addFile([dir1Name], file2, file2Name);
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


describe('Test memory file storage', () => {
  let storage;
  let system;
  let table;
  let browser;

  beforeEach(() => {
    storage = new MemoryFileStorage();
    let SystemClass = StateMixin(BaseFileSystem);
    system = new SystemClass(storage);
    table = new Table();
    browser = new FileBrowser(system, table);
  });

  test('Table has files', async () => {
    let fileObjects = await addTestFiles(system);
    await browser.goTo([], true);

    let rowData = {};
    for (let row of table.rows){
      rowData[row.data.name] = row.data;
    }

    expect(table.rows.length).toEqual(2);
    expect(rowData).toHaveProperty('dir1');
    expect(rowData).toHaveProperty('file1');
  });
});
