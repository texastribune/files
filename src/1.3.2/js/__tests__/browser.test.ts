/* eslint-disable import/first */
/* global jest, test, expect, describe */

import {MemoryDirectory} from "../files/memory";
import {FileBrowser} from "../ui/browser";
import {stringToArrayBuffer} from "../utils";
import {Directory} from "../files/base";

const dir1Name = 'dir1';
const file1Name = 'file1';
const file2Name = 'file2';

const file1Text = 'abc';
const file2Text = 'def';

async function addTestFiles(rootDirectory : Directory){
  let dir1FileObject = await rootDirectory.addDirectory(dir1Name);
  let file1FileObject = await rootDirectory.addFile(stringToArrayBuffer(file1Text),
                                                    file1Name,
                                                    'text/plain');
  let file2FileObject = await dir1FileObject.addFile(stringToArrayBuffer(file2Text),
                                                    file2Name,
                                                    'text/plain');
  return [dir1FileObject, file1FileObject, file2FileObject];
}


describe('Test browser', () => {
  let rootDirectory : Directory;
  let browser : FileBrowser;

  beforeEach(() => {
    rootDirectory = new MemoryDirectory(null, 'root');
    browser = document.createElement('file-browser') as FileBrowser;
    browser.rootDirectory = rootDirectory;
  });

  test('Table has files', async () => {
    let fileObjects = await addTestFiles(rootDirectory);
    browser.path = [];

    await new Promise((resolve, reject) => {
      browser.addEventListener(FileBrowser.EVENT_FILES_CHANGE, resolve);
    });

    if (browser.shadowRoot === null) {
      throw Error("browser does not have shanow root");
    }
    let table = browser.shadowRoot.querySelector('selectable-table');
    if (table === null) {
      throw Error("browser does not have table");
    }
    console.log("TABLE", table);
  });
});
