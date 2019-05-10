// import modules to define custom elements
import "./breadCrumbs.js";
import "./messages.js";
import "./search.js";
import "./contextMenu.js";
import "elements/lib/table.js";
import "elements/lib/dialog.js";

import {BreadCrumbs} from "./breadCrumbs.js";
import {Message} from "./messages.js";
import {Directory, File, FileNotFoundError, SearchResult} from "../files/base.js";
import {convertBytesToReadable, createNode, fileToArrayBuffer, getFirstInPath} from "../utils.js";
import * as icons from './icons.js';
import {ConfirmDialog} from "elements/lib/dialog.js";
import {TextData, TimeData, AbstractTableData, Header, Row, Table} from "elements/lib/table.js";
import {MemoryDirectory} from "../files/memory.js";
import {CachedProxyDirectory} from "../files/proxy.js";
import {SearchBar} from "./search.js";
import {Process} from "../processes/base.js";
import {ConsoleFile} from "../devices/console.js";
import {ContextMenu} from "./contextMenu.js";


export class FileSizeTableData extends AbstractTableData<File | null> {
  private file : File | null = null;

  get data() : File | null {
    return this.file;
  }

  set data(value : File | null){
    if (value === null || value.size === 0 && value instanceof Directory){
      this.innerText = "";
    } else {
      this.innerText = convertBytesToReadable(value.size);
    }
    this.file = value;
  }

  compare(dataElement: AbstractTableData<File | null>): number {
    let size1 = this.file === null ? 0 : this.file.size;
    let size2 = dataElement.data === null ? 0 : dataElement.data.size;
    return size1 - size2;
  }
}

export class FileTableData extends AbstractTableData<File | null> {
  private readonly folderIcon: Element;
  private readonly documentIcon: Element;
  private file : File | null;
  private readonly iconContainer : HTMLSpanElement;

  static hoverImageClass = 'hover-image';

  constructor(){
    super();
    this.folderIcon = createNode(icons.folderIcon) as SVGSVGElement;
    this.folderIcon.classList.add(FileBrowser.tableIconClass);

    this.documentIcon = createNode(icons.documentIcon) as SVGSVGElement;
    this.documentIcon.classList.add(FileBrowser.tableIconClass);

    this.file = null;
    this.iconContainer = document.createElement('span');

    this.shadowDOM.insertBefore(this.iconContainer, this.shadowDOM.firstChild);
  }

  get data() : File | null {
    return this.file;
  }

  set data(value : File | null){
    this.file = value;

    this.removeChildren();
    while (this.iconContainer.lastChild){
      this.iconContainer.removeChild(this.iconContainer.lastChild);
    }
    if (this.file !== null){
      if (this.file.icon !== null) {
        let img = document.createElement('img');
        img.width = 22;
        img.height = 22;
        img.ondragstart = () => {
          return false
        };
        img.classList.add(FileBrowser.tableIconClass);
        this.iconContainer.appendChild(img);

        if (this.file.directory) {
          img.src = this.file.icon;

        } else {
          img.src = this.file.icon;

          // Create expanded image
          let expandedImg = document.createElement('img');
          expandedImg.className = FileTableData.hoverImageClass;
          expandedImg.style.display = 'none';

          img.onmouseover = (event) => {
            if (this.file !== null && this.file.url !== null) {
              expandedImg.src = this.file.url;
            }
            expandedImg.style.display = 'inline-block';
          };
          img.onmouseout = () => {
            expandedImg.style.display = 'none';
          };

          this.iconContainer.appendChild(expandedImg);
        }
      } else if (this.file instanceof Directory) {
        this.iconContainer.appendChild(this.folderIcon);
      } else {
        this.iconContainer.appendChild(this.documentIcon);
      }

      let text = document.createTextNode(this.file.name);
      this.appendChild(text);
    }
  }

  get css(): string {
    // language=CSS
    return super.css + `
       .${FileBrowser.tableIconClass} {
          display: inline-block;
          width: var(--icon-size, 22px);
          height: var(--icon-size, 22px);
          vertical-align: middle;
          margin: 5px;
          fill: var(--icon-color, black);
        }
        
        .${FileTableData.hoverImageClass} {
          position: absolute;
          top: 50%;
          transform: translate(0%, -50%);
          max-height: 90%;
          z-index: 99999;
          background-color: white;
          border: 1px solid black;
          box-shadow: var(--browser-shadow);
        }
    `
  }

  compare(dataElement: AbstractTableData<File | null>): number {
    let name1 : string;
    let name2 : string;
    if (this.data === null){
      name1 = ""
    } else {
      name1 = this.data.name;
    }
    if (dataElement.data === null){
      name2 = ""
    } else {
      name2 = dataElement.data.name;
    }
    return name1.localeCompare(name2);
  }
}

export class PathTableData extends AbstractTableData<string[]> {
  get data() : string[] {
    return this.innerText.split('/').map((segment : string) => {
      return decodeURIComponent(segment);
    });
  }

  set data(value : string[]){
    this.innerText = value.map((segment : string) => {
      return encodeURIComponent(segment);
    }).join('/');
  }

  compare(dataElement: AbstractTableData<string[]>): number {
    return this.innerText.localeCompare(dataElement.innerText);
  }
}


export interface RowData {
  path: string[],
  file: File,
}


interface FileDataTransfer {
  move : string[][]  // list of paths
  copy : string[][]  // list of paths
}

function isFileTransfer(object : any) : object is FileDataTransfer {
  function validArrayOfPaths(array : any[]){
    for (let path of array){
      if (!(path instanceof Array)){
        return false;
      }
      for (let segment in path){
        if (typeof segment !== "string"){
          return false;
        }
      }
    }
    return true;
  }

  return object.move instanceof Array && object.copy instanceof Array &&
    validArrayOfPaths(object.copy) && validArrayOfPaths(object.move);
}

/**
 * An element for browsing a directory.
 * @param {Directory} currentDirectory - The root directory of the browser.
 * @param {Table} table - The table to use for displaying the files.
 */
export class FileBrowser extends Table {
  // Class names
  static actionsContainerId = 'file-actions-container';
  static tableIconClass = 'icon';
  static activeAjaxClass = 'ajax-active';
  static messageContainerId = 'file-message-container';
  static menuContainerId = 'file-menu-container';
  static bodyContainerId = 'body-container';
  static overlayId = 'overlay';
  static buttonClass = 'button';

  static dataTransferType = 'text/table-rows';


  /**
   * @event
   */
  static EVENT_DIRECTORY_CHANGE = 'directory-change';

  /**
   * @event
   */
  static EVENT_FILES_CHANGE = 'files-change';

  /**
   * @event
   */
  static EVENT_SELECTED_FILES_CHANGE = 'selected-change';

  private maxNumMove = 30;  // Maximum number of files that can be moved at once
  private maxNumCopy = 30;  // Maximum number of files that can be copied at once
  private busy: Promise<void>;
  private activePromises : Set<Promise<void>> = new Set();

  private readonly actionsContainer: HTMLDivElement;
  private readonly messagesContainer: HTMLDivElement;
  private readonly menusContainer: HTMLDivElement;
  private readonly searchElement: SearchBar;
  private readonly bodyContainer: HTMLDivElement;
  private readonly tableBusyOverlay: HTMLDivElement;
  private readonly breadCrumbs: BreadCrumbs;
  private readonly tableHeader: Header;

  private cachedCurrentDirectory: CachedProxyDirectory<Directory>;

  private readonly dropdownMenuIcon: Element;
  private readonly carrotIcon: Element;

  constructor() {
    super();

    // Sub elements
    this.breadCrumbs = this.getNewBreadCrumbs();

    this.dropdownMenuIcon = createNode(icons.dropdownMenuIcon);
    this.dropdownMenuIcon.classList.add(FileBrowser.tableIconClass);

    this.carrotIcon = createNode(icons.carrotIcon);
    this.carrotIcon.classList.add(FileBrowser.tableIconClass);
    this.carrotIcon.classList.add('small');

    // Actions container
    this.actionsContainer = document.createElement('div');
    this.actionsContainer.id = FileBrowser.actionsContainerId;

    this.messagesContainer = document.createElement('div');
    this.messagesContainer.id = FileBrowser.messageContainerId;

    this.menusContainer = document.createElement('div');
    this.menusContainer.id = FileBrowser.menuContainerId;
    let contextMenuButton = document.createElement('div');
    contextMenuButton.className = FileBrowser.buttonClass;
    contextMenuButton.appendChild(this.dropdownMenuIcon.cloneNode(true));
    contextMenuButton.appendChild(this.carrotIcon.cloneNode(true));
    contextMenuButton.onclick = (event) => {
      event.stopPropagation();
      let rect = contextMenuButton.getBoundingClientRect();
      this.showContextMenu(rect.left, rect.bottom);
    };
    this.menusContainer.appendChild(contextMenuButton);

    this.searchElement = document.createElement('search-bar') as SearchBar;

    // Table
    this.bodyContainer = document.createElement('div') as HTMLDivElement;
    this.bodyContainer.id = FileBrowser.bodyContainerId;
    this.tableBusyOverlay = document.createElement('div');
    this.tableBusyOverlay.id = FileBrowser.overlayId;
    this.bodyContainer.appendChild(this.tableBusyOverlay);

    // Move table body from shadow root inside wrapper container
    this.bodyContainer.appendChild(this.view);

    // Add action elements
    this.actionsContainer.appendChild(this.breadCrumbs);
    this.actionsContainer.appendChild(this.messagesContainer);
    this.actionsContainer.appendChild(this.menusContainer);
    this.actionsContainer.appendChild(this.searchElement);

    // Add actions and breadcrumbs to the top of the shadow DOM
    this.shadowDOM.insertBefore(this.actionsContainer, this.shadowDOM.firstChild);
    this.shadowDOM.insertBefore(this.breadCrumbs, this.shadowDOM.firstChild);

    this.shadowDOM.appendChild(this.bodyContainer);

    this.tableHeader = this.getNewFileTableHeader();

    // Element events
    document.addEventListener('copy', (event : ClipboardEvent) => {
      if (this.selectedRows.length > 0){
        this.onCutOrCopy(event);
      }
    });

    document.addEventListener('cut', (event : ClipboardEvent) => {
      if (this.selectedRows.length > 0){
        this.onCutOrCopy(event);
      }
    });

    this.addEventListener('paste', (event : ClipboardEvent) => {
      this.onPaste(event);
    });

    this.ondrop = (event: DragEvent) => {
      if (event.dataTransfer !== null) {
        this.handleDataTransfer(event.dataTransfer);
      }
    };

    this.addEventListener(Table.EVENT_SELECTION_CHANGED, () => {
      let event = new Event(FileBrowser.EVENT_SELECTED_FILES_CHANGE);
      this.dispatchEvent(event);
    });

    this.ondblclick = (event : MouseEvent) => {
      // if a file row is double clicked
      let fileRow = getFirstInPath(event, Row);
      if (fileRow !== null){
        let rowData = this.getRowDataFromRow(fileRow);
        this.onOpen(rowData);
      }
    };

    this.searchElement.addEventListener(SearchBar.EVENT_SEARCH_CHANGE, () => {
      this.search(this.searchElement.value);
    });

    this.breadCrumbs.addEventListener(BreadCrumbs.EVENT_PATH_CHANGE, (event: Event) => {
      this.filePath = this.breadCrumbs.path;
    });

    this.oncontextmenu = (event : MouseEvent) => {
      // allow for adding ContextMenu elements as children. These will function as context menus.
      let dialogs = this.flatChildren(ContextMenu);
      if (dialogs.length > 0){
        event.preventDefault();
        event.stopPropagation();

        for (let dialog of dialogs){
          dialog.position = {x: event.pageX - window.pageXOffset, y: event.pageY - window.pageYOffset};
          dialog.velocity = {x: 0, y: 0};
          dialog.visible = true;
        }
      }
    };

    // Set initial directory
    this.busy = Promise.resolve();
    this.cachedCurrentDirectory = new CachedProxyDirectory(new MemoryDirectory(null, 'root'));
  }

  get rootDirectory() : Directory {
    return this.cachedCurrentDirectory.root;
  }

  set rootDirectory(value : Directory){
    this.setCurrentDirectory(new CachedProxyDirectory(value));
  }

  get currentDirectory(): Directory {
    return this.cachedCurrentDirectory;
  }

  protected setCurrentDirectory<T extends Directory>(value: CachedProxyDirectory<T>) {
    this.cachedCurrentDirectory = value;
    this.cachedCurrentDirectory.addOnChangeListener(() => {
      this.logAndLoadWrapper(this.refreshFiles());
    });
    this.logAndLoadWrapper(this.refreshFiles());
    this.breadCrumbs.path = this.filePath;

    let event = new Event(FileBrowser.EVENT_DIRECTORY_CHANGE);
    this.dispatchEvent(event);
  }

  get files(): File[] {
    let files: File[] = [];
    for (let row of this.rows) {
      for (let child of row.children){
        if (child instanceof FileTableData && child.data !== null){
          files.push(child.data);
        }
      }
    }
    return files;
  }

  get selectedFileRows() : Row[] {
    return this.selectedRows;
  }

  get selectedRowData() : RowData[] {
    let rowData : RowData[] = [];
    for (let row of this.selectedFileRows){
      rowData.push(this.getRowDataFromRow(row));
    }
    return rowData;
  }

  get selectedFiles(): File[] {
    return this.selectedRowData.map((rowData) => {
      return rowData.file;
    });
  }

  get selectedPaths(): string[][] {
    return this.selectedRowData.map((rowData) => {
      return rowData.path;
    });
  }

  get filePath(): string[] {
    return this.cachedCurrentDirectory.path.map((directory: Directory) => {
      return directory.name;
    });
  }

  set filePath(path: string[]) {
    this.logAndLoadWrapper(
      this.cachedCurrentDirectory.root.getFile(path.slice(1))
        .then((newDirectory) => {
          if (newDirectory instanceof CachedProxyDirectory) {
            this.setCurrentDirectory(newDirectory);
          } else {
            throw new FileNotFoundError("file must be a directory");
          }
        })
    );
  }

  get css(): string {
    // language=CSS
    return super.css + `
        :host {
          --top-row-height: 30px;
          
          --focus-item-color: #c0d5e8;
          
          --message-height: 24px;
          --search-height: var(--top-row-height);
          --search-icon-size: var(--icon-size);
          --search-icon-color: var(--icon-color);
          --table-body-text-color: var(--body-text-color);
          --dialog-header-height: 28px;
          --dialog-header-background-color: var(--focus-item-color);
          --dialog-header-text-color: black;
          
          position: relative;
          font-family: var(--browser-font, sans-serif);
        }

        .${FileBrowser.tableIconClass} {
          display: inline-block;
          width: var(--icon-size, 22px);
          height: var(--icon-size, 22px);
          vertical-align: middle;
          margin: 5px;
          fill: var(--icon-color, black);
        }

        
        #${FileBrowser.actionsContainerId} {
            width: 100%;
        }
        
        #${FileBrowser.actionsContainerId} .${FileBrowser.tableIconClass} {
          fill: var(--action-icon-color, black);
        }

        .${FileBrowser.tableIconClass}.small {
          width: var(--icon-size-small, 12px);
          height: var(--icon-size-small, 12px);
        }

        .${FileBrowser.tableIconClass}.large {
          width: var(--icon-size-large, 32px);
          height: var(--icon-size-large, 32px);
        }
        
        .${FileBrowser.buttonClass} {
          position: relative;
          display: inline-block;
          box-sizing: border-box;
          padding: 0;
          text-align: center;
          min-width: var(--button-min-width);
          overflow: hidden;
          text-transform: uppercase;
          border-radius: 4px;
          outline-color: #ccc;
          background-color: var(--button-color);
          height: var(--button-height);
          line-height: var(--button-height);
        }
        
        .${FileBrowser.buttonClass}:hover {
            background-color: var(--button-hover-color);
        }
        
        #${FileBrowser.bodyContainerId} {
            position: relative;
            height: inherit;
            width: 100%;
        }
      
        #${FileBrowser.overlayId} {
          position: absolute;
          top: 0;
          display: none;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.1);
          background-position: center;
          background-repeat: no-repeat;
          background-size: 50px 50px;
        }
        
        #${FileBrowser.bodyContainerId}.${FileBrowser.activeAjaxClass} #${FileBrowser.overlayId} {
          background-image: url(data:image/gif;base64,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);
          display: block;
        }
        
        :host(.${FileBrowser.dragOverClass}) #${FileBrowser.overlayId} {          
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAhVJREFUeJzt3bEKhDAQQEH1//9Zy2vkqYgXkZk6xcLmkTLTBAAAAAAAAAD8zKMH+IB19AAH7PiGZfQA8GYCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCPOFs+tjU8D/nbr7XhAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAhX/kln39v/j7fjG7wgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAAAAAAAAAAAJy0AdBdBGYni5DTAAAAAElFTkSuQmCC);
          display: block;
          pointer-events: none; /*prevent interfering with drag&drop*/
        }
        
        search-bar {
            float: right;
        }
        
        #${FileBrowser.menuContainerId} {
            float: left;
        }
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.appendChild(this.tableHeader);
  }

// Wrapper utilities


  async loadingWrapper(promise: Promise<void>): Promise<void> {
    // Add loading class to element while waiting on the async call.
    this.activePromises.add(promise);
    this.bodyContainer.classList.add(FileBrowser.activeAjaxClass);
    try {
      return await promise;
    } finally {
      this.activePromises.delete(promise);
      if (this.activePromises.size === 0){
        this.bodyContainer.classList.remove(FileBrowser.activeAjaxClass);
      }
    }
  }

  async errorLoggingWrapper(promise: Promise<void>): Promise<void> {
    // Catch and log any errors that happen during the execution of the call.
    // WARNING this will prevent and return value and error propagation.
    try {
      return await promise;
    } catch (error) {
      this.addMessage(error, true);
    }
  }

  logAndLoadWrapper(promise: Promise<void>): Promise<void> {
    // Combine the actions in loadingWrapper and errorLoggingWrapper.
    // WARNING this will prevent and return value and error propagation.
    return this.loadingWrapper(this.errorLoggingWrapper(promise));
  }

  // Actions

  private async copyUrl(url : string) : Promise<File> {
    let response = await fetch(url);
    let blob = await response.blob();
    let buffer = await fileToArrayBuffer(blob);
    return this.currentDirectory.addFile(buffer, name, blob.type);
  }

  private moveFiles(files : File[]) {
    if (files.length > this.maxNumMove){
      throw new Error(`cannot move more than ${this.maxNumMove} items.`);
    }

    let moveConfirmDialog = document.createElement('confirm-dialog') as ConfirmDialog;
    moveConfirmDialog.name = "Confirm Move";
    moveConfirmDialog.onClose = () => {
      moveConfirmDialog.remove();
    };
    let confirmText = document.createElement('div');
    let fileNames = files.map((file) => {
      return file.name;
    });
    confirmText.innerText = `Are you sure you want to move ${fileNames.join(', ')} to ${this.currentDirectory.name}?`;
    moveConfirmDialog.addEventListener(ConfirmDialog.EVENT_CONFIRMED, () => {
      // Make sure object isn't already in this directory, and if not move it here.
      let movePromises : Promise<void>[] = [];
      for (let file of files){
        movePromises.push(file.move(this.currentDirectory));
      }
      this.logAndLoadWrapper(Promise.all(movePromises).then(() => {return this.refreshFiles()}));
    });
    moveConfirmDialog.appendChild(confirmText);
    document.body.appendChild(moveConfirmDialog);
    moveConfirmDialog.visible = true;
    moveConfirmDialog.center();
  }

  private copyFiles(files : File[]) {
    if (files.length > this.maxNumCopy){
      throw new Error(`cannot move more than ${this.maxNumCopy} items.`);
    }

    let copyConfirmDialog = document.createElement('confirm-dialog') as ConfirmDialog;
    copyConfirmDialog.name = "Confirm Copy";
    copyConfirmDialog.onClose = () => {
      copyConfirmDialog.remove();
    };
    let confirmText = document.createElement('div');
    let fileNames = files.map((file) => {
      return file.name;
    });
    confirmText.innerText = `Are you sure you want to copy ${fileNames.join(', ')} to ${this.currentDirectory.name}?`;
    copyConfirmDialog.addEventListener(ConfirmDialog.EVENT_CONFIRMED, () => {
      // Make sure object isn't already in this directory, and if not move it here.
      let movePromises : Promise<void>[] = [];
      for (let file of files){
        movePromises.push(file.copy(this.currentDirectory));
      }
      this.logAndLoadWrapper(Promise.all(movePromises).then(() => {return this.refreshFiles()}));
    });
    copyConfirmDialog.appendChild(confirmText);
    document.body.appendChild(copyConfirmDialog);
    copyConfirmDialog.visible = true;
    copyConfirmDialog.center();
  }

  handleDataTransfer(dataTransfer: DataTransfer) {
    // Called when item/items are dragged and dropped on the table
    this.clearMessages();

    let promises = [];

    for (let file of dataTransfer.files) {
      promises.push(fileToArrayBuffer(file).then((buffer) => {
          return this.currentDirectory.addFile(buffer, file.name, file.type);
        })
      );
    }

    let uris = dataTransfer.getData("text/uri-list");
    if (uris) {
      let uriList = uris.split("\n");
      if (uriList.length > this.maxNumMove) {
        alert(`Cannot move more than ${this.maxNumMove} items.`);
      } else {
        for (let i = 0; i < uriList.length; i++) {
          let uri = uriList[i];
          if (!uri.startsWith("#")) {
            let splitUri = uri.split('/');
            let name : string = 'unknown';
            if (splitUri.length > 0 && splitUri[splitUri.length - 1].length < 255) {
              name = splitUri[splitUri.length - 1];
            }
            promises.push(this.copyUrl(uri));
          }
        }
      }
    }

    this.logAndLoadWrapper(Promise.all(promises).then(() => {}));

    let pathsJson = dataTransfer.getData(FileBrowser.dataTransferType);
    if (pathsJson) {
      let dataTransfer : FileDataTransfer = JSON.parse(pathsJson);
      if (!isFileTransfer(dataTransfer)){
        console.log(pathsJson);
        this.addMessage('invalid data', true);
        return;
      }

      let getFiles = (paths : string[][]) : Promise<File>[] => {
        let filePromises : Promise<File>[] = [];
        for (let path of paths){
          if (path.length > 0 && path[0] === this.rootDirectory.name){
            // make sure path relative to root directory
            filePromises.push(this.rootDirectory.getFile(path.slice(1)));
          } else {
            throw new Error(`invalid path`);
          }
        }
        return filePromises;
      };

      if (dataTransfer.move.length > 0){
        this.logAndLoadWrapper(
          Promise.all(getFiles(dataTransfer.move))
            .then((files) => {
              this.moveFiles(files);
            })
        );
      }

      if (dataTransfer.copy.length > 0){
        this.logAndLoadWrapper(
          Promise.all(getFiles(dataTransfer.copy))
            .then((files) => {
              this.copyFiles(files);
            })
        )
      }
    }
  }

  onOpen(rowData : RowData){
    if (rowData.file !== null) {
      if (rowData.file instanceof Directory) {
        if (rowData.path !== null){
          this.filePath = rowData.path;
        }
      } else {
        if (rowData.file.url !== null) {
          if (rowData.file.url.startsWith('data')) {
            // Download if its a data url.
            let link = document.createElement('a');
            link.href = rowData.file.url || "";
            link.setAttribute('download', rowData.file.name);
            link.click();
          } else {
            window.open(rowData.file.url);
          }
        }
      }
    }
  }

  onCutOrCopy(event : ClipboardEvent){
    event.preventDefault();

    let urlList = "";
    let paths : string[][] = [];
    for (let row of this.selectedRows) {
      for (let dataElement of row.children){
        if (dataElement instanceof FileTableData) {
          if (dataElement.data !== null && dataElement.data.url !== null){
            urlList += dataElement.data.url + '\r\n';
          }
        } else if (dataElement instanceof PathTableData){
          paths.push(dataElement.data);
        }
      }
    }

    event.clipboardData.setData('text/plain', urlList);

    let dataTransfer : FileDataTransfer = {
      move: [],
      copy: [],
    };
    if (event.type === 'copy'){
      dataTransfer.copy = dataTransfer.copy.concat(paths);
    } else if (event.type == 'cut') {
      dataTransfer.move = dataTransfer.move.concat(paths);
    }
    event.clipboardData.setData(FileBrowser.dataTransferType, JSON.stringify(dataTransfer));
  }

  onPaste(event : ClipboardEvent){
    this.handleDataTransfer(event.clipboardData);
  }

  // Default element creation

  protected getNewBreadCrumbs() : BreadCrumbs {
    return document.createElement('bread-crumbs') as BreadCrumbs;
  }

  protected getNewFileTableHeader() : Header {
    let header  = document.createElement('table-header') as Header;

    let idColumn = document.createElement('text-data') as TextData;
    let nameColumn = document.createElement('text-data') as TextData;
    let sizeColumn = document.createElement('text-data') as TextData;
    let lastModifiedColumn = document.createElement('text-data') as TextData;
    let createdColumn = document.createElement('text-data') as TextData;
    let typeColumn = document.createElement('text-data') as TextData;
    let pathColumn = document.createElement('text-data') as TextData;

    idColumn.innerText = 'ID';
    nameColumn.innerText = "Name";
    sizeColumn.innerText = "Size";
    lastModifiedColumn.innerText = "Last Modified";
    createdColumn.innerText = "Created";
    typeColumn.innerText = "Type";
    pathColumn.innerText = "Path";

    header.appendChildren([
      idColumn,
      nameColumn,
      sizeColumn,
      lastModifiedColumn,
      createdColumn,
      typeColumn,
      pathColumn,
    ]);

    return header;
  }

  protected getNewFileTableRow(rowData : RowData) : Row {
    let row = document.createElement('table-row') as Row;

    let idColumn = document.createElement('text-data') as TextData;
    let nameColumn = document.createElement('file-data') as FileTableData;
    let sizeColumn = document.createElement('size-data') as FileSizeTableData;
    let lastModifiedColumn = document.createElement('time-data') as TimeData;
    let createdColumn = document.createElement('time-data') as TimeData;
    let typeColumn = document.createElement('text-data') as TextData;
    let pathColumn = document.createElement('path-data') as PathTableData;

    idColumn.data = rowData.file.id;
    nameColumn.data = rowData.file;
    sizeColumn.data = rowData.file;
    lastModifiedColumn.data = rowData.file.lastModified;
    createdColumn.data = rowData.file.created;
    typeColumn.data = rowData.file.mimeType;
    pathColumn.data = rowData.path;

    row.appendChildren([
      idColumn,
      nameColumn,
      sizeColumn,
      lastModifiedColumn,
      createdColumn,
      typeColumn,
      pathColumn,
    ]);

    if (rowData.file.name.startsWith(".")){
      row.hidden = true;
    }

    return row;
  }

  protected getRowDataFromRow(row : Row) : RowData {
    let file : File | null = null;
    let path : string[] | null = null;
    for (let child of row.children){
      if (child instanceof FileTableData && child.data !== null){
        file = child.data;
      }
      if (child instanceof PathTableData){
        path = child.data;
      }
    }
    if (file === null){
      throw new Error("no file for row");
    }
    if (path === null){
      throw new Error("no path for row");
    }
    return {
      file: file,
      path: path,
    }
  }


  // Utility functions


  protected setTableData(rowData: RowData[]) {
    let tableRows: Row[] = [];
    for (let data of rowData) {
      let tableRow = this.getNewFileTableRow(data);
      if (data.file instanceof Directory){
        tableRow.addDragoverAction(() => {
          if (data.path !== null){
            this.filePath = data.path;
          }
        });
        tableRow.addEventListener('dragstart', (event : DragEvent) => {
            if (event.dataTransfer !== null){
              let dataTransfer : FileDataTransfer = {
                move: [data.path],
                copy: [],
              };
              event.dataTransfer.setData(FileBrowser.dataTransferType, JSON.stringify(dataTransfer));
              event.dataTransfer.dropEffect = 'move';
            }
        });
      }
      tableRows.push(tableRow);
    }
    this.rows = tableRows;
    this.dispatchEvent(new Event(FileBrowser.EVENT_FILES_CHANGE));
  }

  async search(searchTerm: string) {
    this.clearMessages();
    if (searchTerm) {
      await this.logAndLoadWrapper(
        (async () => {
          let searchResults = await this.currentDirectory.search(searchTerm);

          // Normalize relative path to the root directory for each result
          let currentPath = this.filePath;
          let normalizedResults : SearchResult[] = [];
          for (let result of searchResults) {
            normalizedResults.push({
              file: result.file,
              path: currentPath.concat(result.path),
            });
          }

          let readablePath = this.filePath.join('/');
          this.addMessage(
            `${searchResults.length} search results for "${searchTerm}" in ${readablePath}.`
          );
          await this.setTableData(normalizedResults);
        })()
      );
    } else {
      await this.logAndLoadWrapper(this.resetFiles());
    }
  }

  showContextMenu(positionX: number, positionY: number) {
    // Move the context menu to the click position
    let event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: false,
      view: window,
      button: 2,
      buttons: 0,
      clientX: positionX,
      clientY: positionY
    });
    this.dispatchEvent(event);
  }

  execute(path : string[]){
    let console = new ConsoleFile();
    if (path.length > 0 && path[0] === this.rootDirectory.name){
      // make sure path relative to root directory
      new Process(null, this.rootDirectory, path.slice(1), console, console);
    } else {
      throw new Error(`invalid path`);
    }
  }

  addMessage(message: Error | string, isError?: boolean) {
    console.log(message);
    console.trace();
    let errorMessage = document.createElement('user-message') as Message;
    if (message instanceof Error || isError) {
      errorMessage.setAttribute('error', "");
    }
    errorMessage.innerText = message.toString();
    this.messagesContainer.appendChild(errorMessage);
  }

  clearMessages() {
    while (this.messagesContainer.firstChild) {
      this.messagesContainer.removeChild(this.messagesContainer.firstChild);
    }
  }

  resetFiles() : Promise<void> {
    this.busy = (async () => {
      try {
        await this.busy;
      } finally {
        let children = await this.cachedCurrentDirectory.getChildren();
        let rowData: RowData[] = children.map((child) => {
          return {
            path: this.filePath.concat([child.name]),
            file: child,
          }
        });
        await this.setTableData(rowData);
      }
    })();
    return this.busy;
  }

  refreshFiles() : Promise<void> {
    this.cachedCurrentDirectory.clearCache();
    return this.resetFiles();
  }
}


customElements.define('file-browser', FileBrowser);
customElements.define('file-data', FileTableData);
customElements.define('size-data', FileSizeTableData);
customElements.define('path-data', PathTableData);