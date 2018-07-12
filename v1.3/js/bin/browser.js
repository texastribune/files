import {FileBrowser, DialogBrowser, ConfigFileMixin} from "../ui/browser.js";
import {Table} from "../ui/table.js";
import {Dialog} from "../ui/dialog.js";


export default async function main(elementId) {
  this.trackState = true;
  let browserContainer = document.getElementById(elementId);
  let table = new Table();
  table.selectMultiple = true;
  let browser;
  if (browserContainer){
    let BrowserClass = ConfigFileMixin(FileBrowser);
    browser = new BrowserClass(this, table);
    browserContainer.appendChild(browser.element);
  } else {
    let BrowserClass = ConfigFileMixin(DialogBrowser);
    browser = new BrowserClass(this, table, new Dialog());
    browser.dialog.show();
  }
  browser.element.id = 'FB' + Math.random().toString(36).split('.')[1];
  return `New browser created with id=${browser.element.id}`;
}
