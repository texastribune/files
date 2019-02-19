import History from "./history";
import {Message} from "./messages";
import {File, Directory, FileNotFoundError} from "../files/base";
import {
  convertBytesToReadable, compareDateStrings,
  compareNumbers, compareStrings, fileToArrayBuffer
} from "../utils";
import * as icons from './icons.js';
import {parseConfigFile, updateConfigFile} from "./config";
import {ConfirmDialog, Dialog} from "elements/lib/dialog";
import {Table, Header, Row, Data} from "elements/lib/table";
import {MemoryDirectory} from "../files/memory";
import {CachedProxyDirectory} from "../files/proxy";
import {CustomElement} from "elements/lib/element";

class FileTableRow extends Row {
  private file : File | null = null;

  getFile() : File | null {
    return this.file
  }

  setFile(value : File) {
    this.file = value;

    let idColumn = document.createElement('table-data') as Data;
    let nameColumn = document.createElement('table-data') as Data;
    let sizeColumn = document.createElement('table-data') as Data;
    let lastModifiedColumn = document.createElement('table-data') as Data;
    let createdColumn = document.createElement('table-data') as Data;
    let typeColumn = document.createElement('table-data') as Data;

    this.hidden = this.file.name.startsWith('.');

    idColumn.innerText = value.id;
    nameColumn.innerText = value.name;
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
}

class FileTableHeader extends Header {
  constructor(){
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
  static menuContainerClass =  'file-menu-container';
  static searchContainerClass =  'file-search-container';
  static stateManagerContainerClass = 'file-breadcrumbs-container';
  static contextMenuClass = 'file-browser-context-menu';
  static dropdownMenuButtonClass = 'dropdown-menu button';
  static fileBrowserDialogClass = 'file-browser-dialog';

  private searchPending : boolean = false;  // For search debounce
  private messageRemovalDelay : number | null = null;
  private maxNumMove = 30;  // Maximum number of files that can be moved at once
  private busy : Promise<void>;

  private readonly actionsContainer : HTMLDivElement;
  private readonly messagesContainer : HTMLDivElement;
  private readonly menusContainer : HTMLDivElement;
  private readonly searchContainer : HTMLDivElement;
  private readonly tableContainer : HTMLDivElement;
  private readonly history : History;

  private readonly table : Table;
  private readonly contextMenu : Dialog;
  private currentDirectory : CachedProxyDirectory;

  private readonly dropdownMenuIcon : SVGSVGElement;
  private readonly carrotIcon : SVGSVGElement;
  private readonly searchIcon : SVGSVGElement;
  private readonly folderIcon : SVGSVGElement;
  private readonly documentIcon : SVGSVGElement;


  constructor() {
    super();

    // Sub elements
    this.table = document.createElement('selectable-table') as Table;
    this.history = document.createElement('bread-crumbs') as History;

    this.dropdownMenuIcon = FileBrowser.createIconTemplate(icons.dropdownMenuIcon);
    this.dropdownMenuIcon.classList.add(FileBrowser.tableIconClass);

    this.carrotIcon = FileBrowser.createIconTemplate(icons.carrotIcon);
    this.carrotIcon.classList.add(FileBrowser.tableIconClass);
    this.carrotIcon.classList.add('small');

    this.searchIcon = FileBrowser.createIconTemplate(icons.searchIcon);
    this.searchIcon.classList.add(FileBrowser.tableIconClass);

    this.folderIcon = FileBrowser.createIconTemplate(icons.folderIcon);
    this.folderIcon.classList.add(FileBrowser.tableIconClass);

    this.documentIcon = FileBrowser.createIconTemplate(icons.documentIcon);
    this.documentIcon.classList.add(FileBrowser.tableIconClass);

    // Context menu
    this.contextMenu = document.createElement('base-dialog') as Dialog;
    this.contextMenu.className = FileBrowser.contextMenuClass;
    this.contextMenu.name = "Settings";

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
    this.actionsContainer.appendChild(this.history);
    this.actionsContainer.appendChild(this.messagesContainer);
    this.actionsContainer.appendChild(this.menusContainer);
    this.actionsContainer.appendChild(this.searchContainer);

    this.table.oncontextmenu = (event : MouseEvent) => {
        this.showContextMenu(event.pageX, event.pageY);
    };

    this.table.ondrop = (event : DragEvent) => {
      if (event.dataTransfer !== null){
        this.handleDataTransfer(event.dataTransfer);
      }
    };

    let tableHeader = document.createElement('file-header') as FileTableHeader;
    this.table.appendChild(tableHeader);


    this.history.onclick = (path : MouseEvent) => {
        this.path = this.history.path;
    };

    this.busy = Promise.resolve();
    this.currentDirectory = new CachedProxyDirectory(new MemoryDirectory(null, 'root'));
  }

  static get observedAttributes() {
    return [];
  }

  updateAttributes(attributes: { [p: string]: string | null }): void {
  }

  private static createIconTemplate(icon : string){
    let template = document.createElement('template');
    template.innerHTML = icon;
    return template.content.firstChild as SVGSVGElement;
  }

  get rootDirectory() : Directory {
    return this.currentDirectory.root;
  }

  set rootDirectory(value : Directory){
    console.log("SET ROOT", value, value.getChildren().then((val) => console.log(val)));
    this.currentDirectory = new CachedProxyDirectory(value);
    this.refreshFiles();
  }

  get path() : string[] {
    return this.currentDirectory.path.slice(1).reduce((pathArray : string[], directory : Directory) => {
      pathArray.push(directory.name);
      return pathArray;
    }, []);
  }

  set path(path : string[]){
    console.log("SET PATH", path);
    this.busy = this.busy
        .then(() => {
          return this.logAndLoadWrapper(
              this.currentDirectory.root.getFile(path)
                  .then((newDirectory) => {
                    console.log("NEW DIR", newDirectory);
                    if (newDirectory instanceof CachedProxyDirectory){
                      this.currentDirectory = newDirectory;
                    } else {
                      throw new FileNotFoundError("file must be a directory");
                    }
                    this.history.path = path;
                    return this.currentDirectory.getChildren();
                  })
                  .then((files) => {
                    this.setTableData(files);
                  })
          )}
        );
  }

  get css(): string | null{
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
    `;
  }

  render(shadowRoot: ShadowRoot): void {
    super.render(shadowRoot);
    shadowRoot.appendChild(this.history);
    shadowRoot.appendChild(this.actionsContainer);
    shadowRoot.appendChild(this.tableContainer);
  }

// Wrapper utilities


  async loadingWrapper(promise : Promise<void>) : Promise<void>{
    // Add loading class to element while waiting on the async call.
    this.classList.add(FileBrowser.activeAjaxClass);
    try {
      return await promise;
    } finally {
      this.classList.remove(FileBrowser.activeAjaxClass);
    }
  }

  async errorLoggingWrapper(promise : Promise<void>) : Promise<void>{
    // Catch and log any errors that happen during the execution of the call.
    // WARNING this will prevent and return value and error propagation.
    try{
      return await promise;
    } catch (error){
      this.addMessage(error, true);
    }
  }

  logAndLoadWrapper(promise : Promise<void>) : Promise<void>{
    // Combine the actions in loadingWrapper and errorLoggingWrapper.
    // WARNING this will prevent and return value and error propagation.
    return this.loadingWrapper(this.errorLoggingWrapper(promise));
  }


  // Element Builders

  createSearchElements(){
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
      if (!this.searchPending && event.key === 'Enter'){
        this.search(searchInput.value);
      }
    };
    let searchContainer = document.createElement('div');
    searchContainer.className = FileBrowser.searchContainerClass;
    searchContainer.appendChild(this.searchIcon);
    searchContainer.appendChild(searchInput);
    return searchContainer;
  }

  createMenus(){
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

  async handleDataTransfer(dataTransfer : DataTransfer){
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
            if (splitUri.length > 0 && splitUri[splitUri.length-1].length < 255){
              promises.push(this.currentDirectory.addFile(uri, splitUri[splitUri.length-1]));
            } else {
              promises.push(this.currentDirectory.addFile(uri, 'unknown'));
            }
          }
        }
      }
    }

    this.logAndLoadWrapper(Promise.all(promises).then(() => {}));

    let rowsText = dataTransfer.getData(Table.dataTransferType);
    if (rowsText) {
      let rows = JSON.parse(rowsText);
      let names = [];
      let rowsToMove = [];
      for (let rowData of rows){
        names.push(rowData.name);
      }
      if (rowsToMove.length > this.maxNumMove) {
        alert(`Cannot move more than ${this.maxNumMove} items.`);
      } else if (rowsToMove.length > 0){
        let moveConfirmDialog = document.createElement('confirm-dialog') as ConfirmDialog;
        moveConfirmDialog.name = "Confirm Move";
        moveConfirmDialog.onClose = () => {
          moveConfirmDialog.remove();
        };
        let confirmText = document.createElement('div');
        confirmText.innerText = `Are you sure you want to move ${names.join(', ')}?`;
        moveConfirmDialog.onConfirmed = () => {
          let promises = [];
          for (let rowData of rows){
            // Make sure object isn't already in this directory, and if not move it here.
            let moveFile = async (rowData : Directory) => {
              let fileObject = await this.currentDirectory.getFile(rowData.path);
              return await this.currentDirectory.move(fileObject);
            };
            promises.push(moveFile(rowData));
          }
          this.logAndLoadWrapper(Promise.all(promises).then(() => {}));
          this.contextMenu.visible = false;
        };
        moveConfirmDialog.appendChild(confirmText);
        moveConfirmDialog.visible = true;
      }
    }
  }

  async search(searchTerm : string) {
    this.clearMessages();
    if (searchTerm){
      await this.loadingWrapper(this.currentDirectory.search(searchTerm).then((foundFiles) => {
        this.setTableData(foundFiles);
        let readablePath = [this.history.baseName].concat(this.path).join('/');
        this.addMessage(
            `${foundFiles.length} search results for "${searchTerm}" in ${readablePath}.`
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
  private fileObjectToTableRow(fileObject : File) : FileTableRow {
    let tableRow = document.createElement('file-row') as FileTableRow;
    tableRow.setFile(fileObject);
    if (fileObject.directory){
      tableRow.addDragoverAction(() => {
        this.path = this.path.concat([fileObject.name]);
      });
    }
    return tableRow;
  }

  setTableData(files : File[]){
    let tableRows : Row[] = [];
    for (let fileObject of files){
      let newRow = this.fileObjectToTableRow(fileObject);
      newRow.hidden = fileObject.name.startsWith('.');

      // When a directory is dragged over for a period of time, go to the directory.
      if (fileObject instanceof Directory){
        newRow.addDragoverAction(() => {
          this.path = this.path.concat([fileObject.name]);
        });
        newRow.ondblclick = (event : MouseEvent) => {
          // Goto directory
          this.path = this.path.concat([fileObject.name]);
        }
      } else {
        newRow.ondblclick = (event : MouseEvent) => {
          // go to url (if dataurl download)
          if (fileObject.url !== null) {
            if (fileObject.url.startsWith('data')){
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
      tableRows.push(newRow);
    }
    this.table.rows = tableRows;
  }

  showContextMenu(positionX : number, positionY : number){
    // Add the items to the context menu
    this.contextMenu.removeChildren();
    let selectedFileRows : FileTableRow[] = [];
    for (let row of this.table.selectedRows){
      if (row instanceof FileTableRow){
        selectedFileRows.push(row);
      }
    }
    this.contextMenu.appendChildren(this.getMenuItems(selectedFileRows));

    // Move the context menu to the click position
    this.contextMenu.position = {x: positionX, y: positionY};
    this.contextMenu.velocity = {x: 0, y: 0};

    this.contextMenu.visible = true;
  }

  getMenuItems(selectedFileRows : FileTableRow[]) {
    let menuItems = [];

    // Add items that should exist only when there is selected data.
    if (selectedFileRows.length > 0){
      // Add items that should exist only when there is one selected item.
      if (selectedFileRows.length === 1) {
        const selectedRowData = selectedFileRows[0];
        const selectedFile = selectedRowData.getFile();

        if (selectedFile !== null){
          // Add an open button to navigate to the selected item.
          let openButton = document.createElement('div');
          openButton.innerText = 'Open';
          openButton.onclick = () => {
            if (selectedFile.directory) {
              this.path = this.path.concat([selectedFile.name]);
            } else {
              window.open(selectedFile.url || "");
            }
            this.contextMenu.visible = false;
          };
          menuItems.push(openButton);

          if (selectedFile.url){
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
                  if (newName !== null){
                    this.contextMenu.visible = false;
                    await selectedFile.rename(newName);
                    await this.refreshFiles();
                  }
                })()
            );
          };
          menuItems.push(renameButton);

          if (selectedFile.mimeType === 'application/javascript'){
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
      deleteButton.onclick = (event : MouseEvent) => {
        event.preventDefault();
        event.stopPropagation(); // Prevent from closing new dialog immediately

        let deleteDialog = document.createElement('confirm-dialog') as ConfirmDialog;
        this.contextMenu.appendChild(deleteDialog);
        deleteDialog.onClose = () => {
          deleteDialog.remove();
        };
        let removeText = document.createElement('div');
        let names = [];
        for (let fileRow of selectedFileRows){
          let file = fileRow.getFile();
          if (file !== null){
            names.push(file.name);
          }
        }
        removeText.innerText = `Are you sure you want to remove ${names.join(', ')}?`;
        let promises : Promise<void>[] = [];
        deleteDialog.onConfirmed = () => {
          this.logAndLoadWrapper(
            (async () => {
              for (let row of selectedFileRows) {
                let file = row.getFile();
                if (file !== null){
                  promises.push(file.delete());
                }
              }
              this.contextMenu.visible = false;
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
      if (selectedFileRows.length <= 30){
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
                if (moveBrowser.table.selectedRows.length === 1){
                  let selectedName = moveBrowser.table.selectedData.values().next().value.name;
                  path.push(selectedName);
                }

                let movePromises = [];
                for (let rowData of selectedFileRows) {
                  let fileObject = await moveBrowser.currentDirectory.getFile(rowData.path);
                  movePromises.push(moveBrowser.currentDirectory.move(path, fileObject).then(() => {}));
                }
                await Promise.all(movePromises);
                await this.refreshFiles();
              })()
            );
          };

          this.contextMenu.appendChild(moveDialog);
          moveDialog.addEventListener(Dialog.EVENT_CLOSED, () => {
            this.contextMenu.removeChild(moveDialog);
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
        if (fileInput.files !== null){
          for (let file of fileInput.files) {
            promises.push(fileToArrayBuffer(file).then((buffer) => {
                return this.currentDirectory.addFile(buffer, file.name, file.type);
              })
            )
          }
        }

        this.contextMenu.visible = false;

        this.logAndLoadWrapper(Promise.all(promises).then(() => {}));
      };

      fileDialog.appendChild(fileInputDiv);
      this.contextMenu.appendChild(fileDialog);
      fileDialog.visible = true;
    };
    menuItems.push(addFileButton);

    let addDirectoryButton = document.createElement('div');
    addDirectoryButton.innerText = 'Add Directory';
    addDirectoryButton.onclick = () => {
      let name = prompt("Directory Name");
      if (name !== null){
        this.logAndLoadWrapper(this.currentDirectory.addDirectory(name).then(() => {}));
      }
      this.contextMenu.visible = false;
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

  addMessage(message : Error | string, isError? : boolean) {
    console.log(message);
    let errorMessage = document.createElement('user-message') as Message;
    if (message instanceof Error || isError){
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

  async refreshFiles(){
    this.currentDirectory.clearCache();
    let children = await this.currentDirectory.getChildren();
    console.log("CHILDREN", children, this.currentDirectory);
    await this.setTableData(children);
  }
}


export class DialogBrowser extends FileBrowser {
  /**
   * An file browser inside a dialog.
   */
  constructor(currentDirectory, table, dialog){
    // Dialog must be created before browser element any child dialogs for proper order in dom to appear on top
    dialog = dialog || new ConfirmDialog();

    super(currentDirectory, table);

    this._dialog = dialog;
    this.contextMenu.parent = this._dialog;
    this.table.visibleColumnsDialog.parent = this._dialog;
    this._dialog.items = [this.element];
  }

  get dialog(){
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

    static get localConfigPath(){
      return ['.config', 'browser'];
    }

    static get sharedConfigPath(){
      return ['Files', '.config', 'browser'];
    }

    static get configPaths(){
      return [
        this.sharedConfigPath,
        this.localConfigPath
      ];
    }

    set config(configObject){
      let visibleColumns = configObject['visibleColumns'];
      if (visibleColumns){
        let visibleColumnsArray = visibleColumns.split(',');
        for (let column of this.table.columns){
          column.visible = visibleColumnsArray.includes(column.name);
        }
      }

      let defualtSortColumn = configObject['defaultSortColumn'];
      if (defualtSortColumn){
        let reverse = false;
        if (defualtSortColumn.startsWith('-')){
          reverse = true;
          defualtSortColumn = defualtSortColumn.slice(1)
        }
        for (let column of this.table.columns){
          if (column.name === defualtSortColumn){
            let func;
            if (column.sortCompare && reverse){
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
      if (this.table){
        for (let column of this.table.columns){
          let existing = column.onVisibilityChange;
          column.onVisibilityChange = (vis) => {
            existing(vis);
            let visibleColumnNames = [];
            for (let column of this.table.columns){
              if (column.visible){
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

    async addLocalConfigFile(){
      let path = this.constructor.localConfigPath.slice();
      let name = path.pop();
      let checked = [];

      while (path.length > 0){
        checked.push(path.shift());
        try{
          await this.currentDirectory.getFile(checked);
        } catch (error) {
          if (error instanceof FileNotFoundError){
            await this.currentDirectory.addDirectory(checked.slice(0, checked.length - 1), checked[checked.length-1]);
          } else {
            throw error;
          }
        }
      }
      await this.currentDirectory.addFile(checked, new File([""], name, {type: 'text/plain'}), name);
    }

    async addLocalConfig(newConfig){
      let dataBuffer;
      try {
        let configFileObject = await this.currentDirectory.getFile(this.constructor.localConfigPath);
        let oldDataBuffer = await configFileObject.read();
        dataBuffer = updateConfigFile(newConfig, oldDataBuffer);
      } catch (error) {
        if (error instanceof FileNotFoundError){
          await this.currentDirectory.waitOn(this.addLocalConfigFile.bind(this))();
        }
        dataBuffer = updateConfigFile({});
      }

      try{
        await this.currentDirectory.write(this.constructor.localConfigPath, dataBuffer);
      } catch (e) {
        if (e instanceof FileNotFoundError){
          await this.currentDirectory.write(this.constructor.localConfigPath, dataBuffer);
        }
      }
    }

    async getConfig(){
      let config = {};
      let configPath = this.constructor.configPaths.slice();
      let configFile = null;
      while (configFile === null && configPath.length > 0){
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