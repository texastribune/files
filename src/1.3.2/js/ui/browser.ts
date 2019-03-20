// import models to define custom elements
import "./breadCrumbs";
import "./messages";
import "elements/lib/table";
import "elements/lib/dialog";

import {BreadCrumbs} from "./breadCrumbs";
import {Message} from "./messages";
import {Directory, File, FileNotFoundError, SearchResult} from "../files/base";
import {convertBytesToReadable, createNode, fileToArrayBuffer} from "../utils";
import * as icons from './icons.js';
import {parseConfigFile, updateConfigFile} from "./config";
import {ConfirmDialog, Dialog} from "elements/lib/dialog";
import {Data, Header, Row, Table} from "elements/lib/table";
import {MemoryDirectory} from "../files/memory";
import {CachedProxyDirectory} from "../files/proxy";
import {CustomElement} from "elements/lib/element";

interface RowData {
  path: string[],
  file: File,
}

class FileTableRow extends Row {
  private file: File | null = null;
  private readonly folderIcon: Element;
  private readonly documentIcon: Element;

  constructor() {
    super();

    this.folderIcon = createNode(icons.folderIcon);
    this.folderIcon.classList.add(FileBrowser.tableIconClass);

    this.documentIcon = createNode(icons.documentIcon);
    this.documentIcon.classList.add(FileBrowser.tableIconClass);
  }

  getFile(): File | null {
    return this.file
  }

  setFile(value: File) {
    this.file = value;

    let idColumn = document.createElement('table-data') as Data;
    let nameColumn = this.createNameColumn();
    let sizeColumn = document.createElement('table-data') as Data;
    let lastModifiedColumn = document.createElement('table-data') as Data;
    let createdColumn = document.createElement('table-data') as Data;
    let typeColumn = document.createElement('table-data') as Data;

    this.hidden = this.file.name.startsWith('.');

    idColumn.innerText = value.id;
    sizeColumn.innerText = convertBytesToReadable(value.size);
    lastModifiedColumn.innerText = new Date(value.lastModified).toLocaleString();
    createdColumn.innerText = new Date(value.created).toLocaleString();
    typeColumn.innerText = value.mimeType;

    this.removeChildren();
    this.appendChildren([
      idColumn,
      nameColumn,
      sizeColumn,
      lastModifiedColumn,
      createdColumn,
      typeColumn,
    ]);
  }

  createNameColumn(): Data {
    let column = document.createElement('table-data') as Data;
    if (this.file !== null) {
      if (this.file.icon !== null) {
        let img = document.createElement('img');
        img.width = 22;
        img.height = 22;
        img.ondragstart = () => {
          return false
        };
        img.classList.add(FileBrowser.tableIconClass);

        column.appendChild(img);

        if (this.file.directory) {
          img.src = this.file.icon;

        } else {
          img.src = this.file.icon;

          // Create expanded image
          let expandedImg = document.createElement('img');
          expandedImg.className = 'hover-image';
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

          column.appendChild(expandedImg);
        }
      } else if (this.file instanceof Directory) {
        column.appendChild(this.folderIcon);
      } else {
        column.appendChild(this.documentIcon);
      }

      let text = document.createTextNode(this.file.name);
      column.appendChild(text);
    }

    return column;
  }
}

class FileTableHeader extends Header {
  constructor() {
    super();
  }


  refresh(): void {
    super.refresh();
    let idColumn = document.createElement('table-data') as Data;
    let nameColumn = document.createElement('table-data') as Data;
    let sizeColumn = document.createElement('table-data') as Data;
    let lastModifiedColumn = document.createElement('table-data') as Data;
    let createdColumn = document.createElement('table-data') as Data;
    let typeColumn = document.createElement('table-data') as Data;

    idColumn.innerText = 'ID';
    nameColumn.innerText = "Name";
    sizeColumn.innerText = "Size";
    lastModifiedColumn.innerText = "Last Modified";
    createdColumn.innerText = "Created";
    typeColumn.innerText = "Type";

    this.appendChild(idColumn);
    this.appendChild(nameColumn);
    this.appendChild(sizeColumn);
    this.appendChild(lastModifiedColumn);
    this.appendChild(createdColumn);
    this.appendChild(typeColumn);
  }
}


/**
 * An element for browsing a file system.
 * @param {Directory} currentDirectory - The root directory of the browser.
 * @param {Table} table - The table to use for displaying the files.
 */
export class FileBrowser extends CustomElement {
  // Class names
  static actionsContainerClass = 'file-actions-container';
  static tableContainerClass = 'file-browser-table-container';
  static tableIconClass = 'icon';
  static activeAjaxClass = 'ajax-active';
  static searchInputClass = 'file-search-input';
  static messageContainerClass = 'file-message-container';
  static menuContainerClass = 'file-menu-container';
  static searchContainerClass = 'file-search-container';
  static stateManagerContainerClass = 'file-breadcrumbs-container';
  static dropdownMenuButtonClass = 'dropdown-menu button';
  static fileBrowserDialogClass = 'file-browser-dialog';

  /**
   * @event
   */
  static EVENT_FILES_CHANGE = 'change';

  private searchPending: boolean = false;  // For search debounce
  private messageRemovalDelay: number | null = null;
  private maxNumMove = 30;  // Maximum number of files that can be moved at once
  private busy: Promise<void>;

  private readonly actionsContainer: HTMLDivElement;
  private readonly messagesContainer: HTMLDivElement;
  private readonly menusContainer: HTMLDivElement;
  private readonly searchContainer: HTMLDivElement;
  private readonly tableContainer: HTMLDivElement;
  private readonly breadCrumbs: BreadCrumbs;

  private readonly table: Table;
  private readonly fileContextMenu: Dialog;
  private cachedCurrentDirectory: CachedProxyDirectory = new CachedProxyDirectory(new MemoryDirectory(null, 'root'));

  private readonly dropdownMenuIcon: Element;
  private readonly carrotIcon: Element;
  private readonly searchIcon: Element;


  constructor() {
    super();

    // Sub elements
    this.table = document.createElement('selectable-table') as Table;
    this.breadCrumbs = document.createElement('bread-crumbs') as BreadCrumbs;

    this.dropdownMenuIcon = createNode(icons.dropdownMenuIcon);
    this.dropdownMenuIcon.classList.add(FileBrowser.tableIconClass);

    this.carrotIcon = createNode(icons.carrotIcon);
    this.carrotIcon.classList.add(FileBrowser.tableIconClass);
    this.carrotIcon.classList.add('small');

    this.searchIcon = createNode(icons.searchIcon);
    this.searchIcon.classList.add(FileBrowser.tableIconClass);

    // Context menu
    this.fileContextMenu = document.createElement('base-dialog') as Dialog;
    this.fileContextMenu.name = "Settings";

    // Actions container
    this.actionsContainer = document.createElement('div');
    this.actionsContainer.className = FileBrowser.actionsContainerClass;

    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = FileBrowser.messageContainerClass;

    this.menusContainer = this.createMenus();
    this.searchContainer = this.createSearchElements();

    this.tableContainer = document.createElement('div');
    this.tableContainer.appendChild(this.table);
    this.tableContainer.className = FileBrowser.tableContainerClass;

    // Add action elements
    this.actionsContainer.appendChild(this.breadCrumbs);
    this.actionsContainer.appendChild(this.messagesContainer);
    this.actionsContainer.appendChild(this.menusContainer);
    this.actionsContainer.appendChild(this.searchContainer);

    this.table.oncontextmenu = (event: MouseEvent) => {
      event.preventDefault();
      this.showContextMenu(event.pageX, event.pageY);
    };

    this.table.ondrop = (event: DragEvent) => {
      if (event.dataTransfer !== null) {
        this.handleDataTransfer(event.dataTransfer);
      }
    };

    let tableHeader = document.createElement('file-header') as FileTableHeader;
    this.table.appendChild(tableHeader);


    this.breadCrumbs.addEventListener(BreadCrumbs.EVENT_PATH_CHANGE, (event: Event) => {
      this.path = this.breadCrumbs.path;
    });

    this.busy = Promise.resolve();
    this.currentDirectory = new CachedProxyDirectory(new MemoryDirectory(null, 'root'));
  }

  static get observedAttributes() {
    return [];
  }

  updateAttributes(attributes: { [p: string]: string | null }): void {
  }

  get rootDirectory(): Directory {
    return this.currentDirectory.root;
  }

  set rootDirectory(value: Directory) {
    this.currentDirectory = new CachedProxyDirectory(value);
  }

  private get currentDirectory(): CachedProxyDirectory {
    return this.cachedCurrentDirectory;
  }

  private set currentDirectory(value: CachedProxyDirectory) {
    this.cachedCurrentDirectory = value;
    this.cachedCurrentDirectory.addOnChangeListener(() => {
      this.logAndLoadWrapper(this.refreshFiles());
    });
    this.logAndLoadWrapper(this.refreshFiles());
  }

  get files(): File[] {
    let files: File[] = [];
    for (let row of this.table.flatChildren(FileTableRow)) {
      let file = row.getFile();
      if (file !== null) {
        files.push(file);
      }
    }
    return files;
  }

  get path(): string[] {
    return this.currentDirectory.path.slice(1).map((directory: Directory) => {
      return directory.name;
    });
  }

  set path(path: string[]) {
    this.currentDirectory.root.getFile(path)
      .then((newDirectory) => {
        if (newDirectory instanceof CachedProxyDirectory) {
          this.currentDirectory = newDirectory;
        } else {
          throw new FileNotFoundError("file must be a directory");
        }
        this.breadCrumbs.path = path;
      });
  }

  get css(): string {
    // language=CSS
    return super.css + `
        :host {
          --icon-color: #5c6873;
          --action-icon-color: #5c6873;
          --icon-size: 22px;
          --icon-size-small: 12px;
          --icon-size-large: 32px;
        }

        .${FileBrowser.tableIconClass} {
          display: inline-block;
          width: var(--icon-size);
          height: var(--icon-size);
          vertical-align: middle;
          margin: 5px;
          fill: var(--icon-color);
        }

        .${FileBrowser.tableIconClass}.small {
          width: var(--icon-size-small);
          height: var(--icon-size-small);
        }

        .${FileBrowser.tableIconClass}.large {
          width: var(--icon-size-large);
          height: var(--icon-size-large);
        }

        .${FileBrowser.tableContainerClass} {
          position: relative;
          float: left;
          width: 100%;
          background: var(--table-background-color);
        }

        .${FileBrowser.tableContainerClass}.dialog-item {
          /*If inside dialog, make smaller*/
          height: 300px;
        }

        .${FileBrowser.tableContainerClass} .hover-image {
          position: absolute;
          top: calc(2 * var(--table-row-height));
          max-height: calc(100% - 3 * var(--table-row-height));
          z-index: 99999;
          background-color: white;
          border: 1px solid black;
          box-shadow: var(--browser-shadow);
        }
        
        .${FileBrowser.tableContainerClass}.${FileBrowser.activeAjaxClass}::after {
          background-color: rgba(0, 0, 0, 0.1);
          background-image: url(data:image/gif;base64,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);
          background-position: center;
          background-repeat: no-repeat;
          background-size: 50px 50px;
        }
        
        .${FileBrowser.tableContainerClass} .table.dragover::after {
          background-color: rgba(0, 0, 0, 0.1);
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAhVJREFUeJzt3bEKhDAQQEH1//9Zy2vkqYgXkZk6xcLmkTLTBAAAAAAAAAD8zKMH+IB19AAH7PiGZfQA8GYCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCPOFs+tjU8D/nbr7XhAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAhX/kln39v/j7fjG7wgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAAAAAAAAAAAJy0AdBdBGYni5DTAAAAAElFTkSuQmCC);
          background-position: center;
          background-repeat: no-repeat;
          background-size: 50px 50px;
        }
        
        .${FileBrowser.searchContainerClass} {
            float: right;
        }
        
        .${FileBrowser.menuContainerClass} {
            float: left;
        }
        
        base-dialog > * {
            margin: 5px;
            cursor: pointer;
        }
    `;
  }

  render(shadowRoot: ShadowRoot): void {
    super.render(shadowRoot);
    shadowRoot.appendChild(this.breadCrumbs);
    shadowRoot.appendChild(this.actionsContainer);
    shadowRoot.appendChild(this.tableContainer);
    shadowRoot.appendChild(this.fileContextMenu);
  }

// Wrapper utilities


  async loadingWrapper(promise: Promise<void>): Promise<void> {
    // Add loading class to element while waiting on the async call.
    this.tableContainer.classList.add(FileBrowser.activeAjaxClass);
    try {
      return await promise;
    } finally {
      this.tableContainer.classList.remove(FileBrowser.activeAjaxClass);
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


  // Element Builders

  createSearchElements() {
    let searchInput = document.createElement('input');
    searchInput.className = FileBrowser.searchInputClass;
    searchInput.placeholder = "Search";
    searchInput.oninput = () => {
      // Wait 300 milliseconds to debounce and then search. Toggle searchPending.
      if (!this.searchPending) {
        this.searchPending = true;
        setTimeout(() => {
          this.search(searchInput.value);
          this.searchPending = false;
        }, 500);
      }
    };
    searchInput.onkeyup = (event) => {
      if (!this.searchPending && event.key === 'Enter') {
        this.search(searchInput.value);
      }
    };
    let searchContainer = document.createElement('div');
    searchContainer.className = FileBrowser.searchContainerClass;
    searchContainer.appendChild(this.searchIcon);
    searchContainer.appendChild(searchInput);
    return searchContainer;
  }

  createMenus() {
    let menusContainer = document.createElement('div');
    menusContainer.className = FileBrowser.menuContainerClass;
    let contextMenuButton = document.createElement('div');
    contextMenuButton.className = FileBrowser.dropdownMenuButtonClass;
    contextMenuButton.appendChild(this.dropdownMenuIcon.cloneNode(true));
    contextMenuButton.appendChild(this.carrotIcon.cloneNode(true));
    contextMenuButton.onclick = (event) => {
      event.stopPropagation();
      let rect = contextMenuButton.getBoundingClientRect();
      let scrollLeft = document.documentElement.scrollLeft;
      let scrollTop = document.documentElement.scrollTop;
      this.showContextMenu(rect.left + scrollLeft, rect.bottom + scrollTop);
    };
    menusContainer.appendChild(contextMenuButton);
    return menusContainer;
  }

  // Actions

  async handleDataTransfer(dataTransfer: DataTransfer) {
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
            if (splitUri.length > 0 && splitUri[splitUri.length - 1].length < 255) {
              promises.push(this.currentDirectory.addFile(uri, splitUri[splitUri.length - 1]));
            } else {
              promises.push(this.currentDirectory.addFile(uri, 'unknown'));
            }
          }
        }
      }
    }

    this.logAndLoadWrapper(Promise.all(promises).then(() => {
    }));

    let rowsText = dataTransfer.getData(Table.dataTransferType);
    if (rowsText) {
      let rows = JSON.parse(rowsText);
      let names = [];
      let rowsToMove = [];
      for (let rowData of rows) {
        names.push(rowData.name);
      }
      if (rowsToMove.length > this.maxNumMove) {
        alert(`Cannot move more than ${this.maxNumMove} items.`);
      } else if (rowsToMove.length > 0) {
        let moveConfirmDialog = document.createElement('confirm-dialog') as ConfirmDialog;
        moveConfirmDialog.name = "Confirm Move";
        moveConfirmDialog.onClose = () => {
          moveConfirmDialog.remove();
        };
        let confirmText = document.createElement('div');
        confirmText.innerText = `Are you sure you want to move ${names.join(', ')}?`;
        moveConfirmDialog.onConfirmed = () => {
          let promises = [];
          for (let rowData of rows) {
            // Make sure object isn't already in this directory, and if not move it here.
            let moveFile = async (rowData: Directory) => {
              let fileObject = await this.currentDirectory.getFile(rowData.path);
              return await this.currentDirectory.move(fileObject);
            };
            promises.push(moveFile(rowData));
          }
          this.logAndLoadWrapper(Promise.all(promises).then(() => {
          }));
          this.fileContextMenu.visible = false;
        };
        moveConfirmDialog.appendChild(confirmText);
        moveConfirmDialog.visible = true;
      }
    }
  }

  async search(searchTerm: string) {
    this.clearMessages();
    if (searchTerm) {
      await this.loadingWrapper(this.currentDirectory.search(searchTerm).then((searchResults: SearchResult[]) => {
        this.setTableData(searchResults);
        let readablePath = this.path.join('/');
        this.addMessage(
          `${searchResults.length} search results for "${searchTerm}" in ${readablePath}.`
        );
      }));
    } else {
      await this.loadingWrapper(this.currentDirectory.getChildren().then((children) => {
        this.setTableData(children);
      }));
    }
  }

  /**
   * Translate the data for a AbstractFile to the data that will be in each table row for that file.
   */
  private fileObjectToTableRow(rowData: RowData): FileTableRow {
    let path = rowData.path;
    let fileObject = rowData.file;
    let tableRow = document.createElement('file-row') as FileTableRow;
    tableRow.setFile(fileObject);
    tableRow.hidden = fileObject.name.startsWith('.');
    if (fileObject.directory) {
      tableRow.addDragoverAction(() => {
        this.path = path;
      });

      tableRow.ondblclick = (event: MouseEvent) => {
        // Goto directory
        this.path = path;
      };
    } else {
      tableRow.ondblclick = (event: MouseEvent) => {
        console.log("DBOULE", fileObject.url);
        // go to url (if dataurl download)
        if (fileObject.url !== null) {
          if (fileObject.url.startsWith('data')) {
            // Download if its a data url.
            let link = document.createElement('a');
            link.href = fileObject.url || "";
            link.setAttribute('download', fileObject.name);
            link.click();
          } else {
            window.open(fileObject.url);
          }
        }
      }
    }
    return tableRow;
  }

  setTableData(rowData: RowData[]) {
    console.log("RDATA", rowData);
    let tableRows: Row[] = [];
    for (let data of rowData) {
      tableRows.push(this.fileObjectToTableRow(data));
    }
    this.table.rows = tableRows;
    this.dispatchEvent(new Event(FileBrowser.EVENT_FILES_CHANGE));
  }

  showContextMenu(positionX: number, positionY: number) {
    console.log("SHOW");
    // Add the items to the context menu
    this.fileContextMenu.removeChildren();
    let selectedFileRows: FileTableRow[] = [];
    for (let row of this.table.selectedRows) {
      if (row instanceof FileTableRow) {
        selectedFileRows.push(row);
      }
    }
    this.fileContextMenu.appendChildren(this.getMenuItems(selectedFileRows));

    // Move the context menu to the click position
    this.fileContextMenu.position = {x: positionX, y: positionY};
    this.fileContextMenu.velocity = {x: 0, y: 0};

    this.fileContextMenu.visible = true;
    console.log("POS", positionY, positionX);
  }

  getMenuItems(selectedFileRows: FileTableRow[]) {
    let menuItems = [];

    // Add items that should exist only when there is selected data.
    if (selectedFileRows.length > 0) {
      // Add items that should exist only when there is one selected item.
      if (selectedFileRows.length === 1) {
        const selectedRowData = selectedFileRows[0];
        const selectedFile = selectedRowData.getFile();

        if (selectedFile !== null) {
          // Add an open button to navigate to the selected item.
          let openButton = document.createElement('div');
          openButton.innerText = 'Open';
          openButton.onclick = () => {
            if (selectedFile.directory) {
              this.path = this.path.concat([selectedFile.name]);
            } else {
              window.open(selectedFile.url || "");
            }
            this.fileContextMenu.visible = false;
          };
          menuItems.push(openButton);

          if (selectedFile.url) {
            let urlButton = document.createElement('div');
            urlButton.innerText = 'Copy Url';
            urlButton.onclick = () => {
              let urlText = document.createElement('textarea');
              // urlText.style.display = 'none';
              urlButton.appendChild(urlText);
              urlText.innerText = selectedFile.url || "";
              urlText.select();
              document.execCommand('copy');
              urlButton.removeChild(urlText);
            };
            menuItems.push(urlButton);
          }

          let renameButton = document.createElement('div');
          renameButton.innerText = 'Rename';
          renameButton.onclick = () => {
            this.logAndLoadWrapper(
              (async () => {
                let newName = prompt("New Name");
                if (newName !== null) {
                  this.fileContextMenu.visible = false;
                  await selectedFile.rename(newName);
                  await this.refreshFiles();
                }
              })()
            );
          };
          menuItems.push(renameButton);

          if (selectedFile.mimeType === 'application/javascript') {
            let runButton = document.createElement('div');
            runButton.innerText = 'Run';
            runButton.onclick = () => {
              this.errorLoggingWrapper(
                (async () => {
                  await this.currentDirectory.execPath(selectedRowData.path);
                })()
              );
            };
            menuItems.push(runButton);
          }
        }
      }

      // Add a delete button that when clicked will delete open another dialog
      // to confirm deletion which from there will delete all selected items.
      let deleteButton = document.createElement('div');
      deleteButton.innerText = 'Delete';
      deleteButton.onclick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation(); // Prevent from closing new dialog immediately

        let deleteDialog = document.createElement('confirm-dialog') as ConfirmDialog;
        this.fileContextMenu.appendChild(deleteDialog);
        deleteDialog.onClose = () => {
          deleteDialog.remove();
        };
        let removeText = document.createElement('div');
        let names = [];
        for (let fileRow of selectedFileRows) {
          let file = fileRow.getFile();
          if (file !== null) {
            names.push(file.name);
          }
        }
        removeText.innerText = `Are you sure you want to remove ${names.join(', ')}?`;
        let promises: Promise<void>[] = [];
        deleteDialog.onConfirmed = () => {
          this.logAndLoadWrapper(
            (async () => {
              for (let row of selectedFileRows) {
                let file = row.getFile();
                if (file !== null) {
                  promises.push(file.delete());
                }
              }
              this.fileContextMenu.visible = false;
              await Promise.all(promises);
              await this.currentDirectory.clearCache();
            })()
          );
        };
        deleteDialog.appendChild(removeText);
        deleteDialog.visible = true;
      };
      menuItems.push(deleteButton);

      // Add a move button that when clicked which opens a new menu with a nested file browser
      // copied from this file browser to get the target path. The selected files will get moved
      // to the target when selected.
      if (selectedFileRows.length <= 30) {
        let moveButton = document.createElement('div');
        moveButton.innerText = 'Move';
        moveButton.onclick = (event) => {
          // Prevent from closing dialog immediately due to outside click
          event.preventDefault();
          event.stopPropagation();


          let moveBrowser = document.createElement('file-browser') as FileBrowser;
          moveBrowser.rootDirectory = this.rootDirectory;
          let moveDialog = document.createElement('confirm-dialog') as ConfirmDialog;

          moveBrowser.table.selectMultiple = false;
          moveDialog.name = "Move Files";
          moveDialog.classList.add(this.fileBrowserDialogClass);
          moveDialog.confirmationText = "Select";
          moveDialog.onConfirmed = () => {
            this.logAndLoadWrapper(
              (async () => {
                let path = moveBrowser.currentDirectory.path;
                if (moveBrowser.table.selectedRows.length === 1) {
                  let selectedName = moveBrowser.table.selectedData.values().next().value.name;
                  path.push(selectedName);
                }

                let movePromises = [];
                for (let rowData of selectedFileRows) {
                  let fileObject = await moveBrowser.currentDirectory.getFile(rowData.path);
                  movePromises.push(moveBrowser.currentDirectory.move(path, fileObject).then(() => {
                  }));
                }
                await Promise.all(movePromises);
                await this.refreshFiles();
              })()
            );
          };

          this.fileContextMenu.appendChild(moveDialog);
          moveDialog.addEventListener(Dialog.EVENT_CLOSED, () => {
            this.fileContextMenu.removeChild(moveDialog);
          });
          moveDialog.visible = true;
        };
        menuItems.push(moveButton);
      }
    }

    let addFileButton = document.createElement('div');
    addFileButton.innerText = 'Add File';
    addFileButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation(); // Prevent from closing new dialog immediately

      let fileDialog = document.createElement('confirm-dialog') as ConfirmDialog;
      fileDialog.name = 'Add File';
      fileDialog.confirmationText = 'Add';
      let fileInputDiv = document.createElement('div');
      let fileInputLabel = document.createElement('span');
      fileInputLabel.innerText = 'File';
      let fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInputDiv.appendChild(fileInputLabel);
      fileInputDiv.appendChild(fileInput);
      fileDialog.onConfirmed = () => {
        let promises = [];
        if (fileInput.files !== null) {
          for (let file of fileInput.files) {
            promises.push(fileToArrayBuffer(file).then((buffer) => {
                return this.currentDirectory.addFile(buffer, file.name, file.type);
              })
            )
          }
        }

        this.fileContextMenu.visible = false;

        this.logAndLoadWrapper(Promise.all(promises).then(() => {
        }));
      };

      fileDialog.appendChild(fileInputDiv);
      this.fileContextMenu.appendChild(fileDialog);
      fileDialog.visible = true;
    };
    menuItems.push(addFileButton);

    let addDirectoryButton = document.createElement('div');
    addDirectoryButton.innerText = 'Add Directory';
    addDirectoryButton.onclick = () => {
      let name = prompt("Directory Name");
      if (name !== null) {
        this.logAndLoadWrapper(this.currentDirectory.addDirectory(name).then(() => {
        }));
      }
      this.fileContextMenu.visible = false;
    };
    menuItems.push(addDirectoryButton);

    let showHiddenDiv = document.createElement('div');
    let showHiddenLabel = document.createElement('span');
    let showHiddenCheckbox = document.createElement('input');
    showHiddenCheckbox.type = 'checkbox';
    showHiddenCheckbox.checked = this.table.showHidden;
    showHiddenLabel.innerText = 'Show Hidden';
    showHiddenCheckbox.onchange = () => {
      this.table.showHidden = showHiddenCheckbox.checked;
    };
    showHiddenDiv.appendChild(showHiddenLabel);
    showHiddenDiv.appendChild(showHiddenCheckbox);
    menuItems.push(showHiddenDiv);

    let visibleColumnsButton = document.createElement('div');
    visibleColumnsButton.innerText = 'Visible Columns';
    visibleColumnsButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation(); // Prevent from closing new dialog immediately

      this.table.visibleColumnsDialog.visible = true;
    };
    menuItems.push(visibleColumnsButton);

    return menuItems;
  }

  addMessage(message: Error | string, isError?: boolean) {
    console.log(message);
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

  refreshFiles() : Promise<void> {
    this.busy = (async () => {
      await this.busy;
      this.currentDirectory.clearCache();
      let children = await this.currentDirectory.getChildren();
      let rowData: RowData[] = children.map((child) => {
        return {
          path: this.path.concat([child.name]),
          file: child
        }
      });
      await this.setTableData(rowData);
    })();
    return this.busy;
  }
}


export class DialogBrowser extends FileBrowser {
  /**
   * An file browser inside a dialog.
   */
  constructor(currentDirectory, table, dialog) {
    // Dialog must be created before browser element any child dialogs for proper order in dom to appear on top
    dialog = dialog || new ConfirmDialog();

    super(currentDirectory, table);

    this._dialog = dialog;
    this.fileContextMenu.parent = this._dialog;
    this.table.visibleColumnsDialog.parent = this._dialog;
    this._dialog.items = [this.element];
  }

  get dialog() {
    return this._dialog;
  }
}

export let ConfigFileMixin = (currentDirectoryClass) => {
  return class extends currentDirectoryClass {
    constructor(...args) {
      super(...args);

      this.logAndLoadWrapper(this.getConfig()
        .then((config) => {
          try {
            this.config = config;
          } catch (e) {
            console.log(`Error setting browser config: ${e}`);
          }
        }));
    }

    static get localConfigPath() {
      return ['.config', 'browser'];
    }

    static get sharedConfigPath() {
      return ['Files', '.config', 'browser'];
    }

    static get configPaths() {
      return [
        this.sharedConfigPath,
        this.localConfigPath
      ];
    }

    set config(configObject) {
      let visibleColumns = configObject['visibleColumns'];
      if (visibleColumns) {
        let visibleColumnsArray = visibleColumns.split(',');
        for (let column of this.table.columns) {
          column.visible = visibleColumnsArray.includes(column.name);
        }
      }

      let defualtSortColumn = configObject['defaultSortColumn'];
      if (defualtSortColumn) {
        let reverse = false;
        if (defualtSortColumn.startsWith('-')) {
          reverse = true;
          defualtSortColumn = defualtSortColumn.slice(1)
        }
        for (let column of this.table.columns) {
          if (column.name === defualtSortColumn) {
            let func;
            if (column.sortCompare && reverse) {
              func = (...args) => {
                return -column.sortCompare(...args);
              }
            } else {
              func = column.sortCompare;
            }
            this.table.defaultSortFunc = func;
            this.setTableData(Object.values(this.currentDirectory.data)); // Refresh data to resort with default sort
          }
        }
      }
    }

    setupTable() {
      super.setupTable();
      if (this.table) {
        for (let column of this.table.columns) {
          let existing = column.onVisibilityChange;
          column.onVisibilityChange = (vis) => {
            existing(vis);
            let visibleColumnNames = [];
            for (let column of this.table.columns) {
              if (column.visible) {
                visibleColumnNames.push(column.name);
              }
            }
            this.addLocalConfig({visibleColumns: visibleColumnNames.join(',')})
              .then()
              .catch((error) => {
                console.log(`Error adding config: ${error}`)
              });
          }
        }
      }
    }

    async addLocalConfigFile() {
      let path = this.constructor.localConfigPath.slice();
      let name = path.pop();
      let checked = [];

      while (path.length > 0) {
        checked.push(path.shift());
        try {
          await this.currentDirectory.getFile(checked);
        } catch (error) {
          if (error instanceof FileNotFoundError) {
            await this.currentDirectory.addDirectory(checked.slice(0, checked.length - 1), checked[checked.length - 1]);
          } else {
            throw error;
          }
        }
      }
      await this.currentDirectory.addFile(checked, new File([""], name, {type: 'text/plain'}), name);
    }

    async addLocalConfig(newConfig) {
      let dataBuffer;
      try {
        let configFileObject = await this.currentDirectory.getFile(this.constructor.localConfigPath);
        let oldDataBuffer = await configFileObject.read();
        dataBuffer = updateConfigFile(newConfig, oldDataBuffer);
      } catch (error) {
        if (error instanceof FileNotFoundError) {
          await this.currentDirectory.waitOn(this.addLocalConfigFile.bind(this))();
        }
        dataBuffer = updateConfigFile({});
      }

      try {
        await this.currentDirectory.write(this.constructor.localConfigPath, dataBuffer);
      } catch (e) {
        if (e instanceof FileNotFoundError) {
          await this.currentDirectory.write(this.constructor.localConfigPath, dataBuffer);
        }
      }
    }

    async getConfig() {
      let config = {};
      let configPath = this.constructor.configPaths.slice();
      let configFile = null;
      while (configFile === null && configPath.length > 0) {
        let path = configPath.shift();
        let localConfig;
        try {
          let configFileObject = await this.currentDirectory.getFile(path);
          let data = await configFileObject.read();
          localConfig = parseConfigFile(data);
        } catch (error) {
          console.log(`Could not get config file at /${path.join('/')}: ${error}`);
          localConfig = {};
        }
        Object.assign(config, localConfig);
      }
      return config;
    }
  };
};

customElements.define('file-browser', FileBrowser);
customElements.define('file-row', FileTableRow);
customElements.define('file-header', FileTableHeader);