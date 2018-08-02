import {Column, Table} from "./table.js";
import History from "./history.js";
import {Dialog, ConfirmDialog} from "./dialog.js";
import {Element} from "./element.js";
import {Message} from "./messages.js";
import {FileNotFoundError} from "../files/storages/base.js";
import {convertBytesToReadable, compareDateStrings,
        compareNumbers, compareStrings} from "../utils.js";
import * as icons from './icons.js';
import {parseConfigFile} from "./config.js";
import {updateConfigFile} from "./config.js";


export class FileBrowser extends Element {
  /**
   * An element for browsing a file system.
   * @param {BaseFileSystem} fileSystem - The file system for browsing.
   * @param {Table} table - The table to use for displaying the files.
   */
  constructor(fileSystem, table) {
    super();

    // Initialize variables
    this.searchPending = false;  // For search debounce
    this.messageRemovalDelay = null;
    this.maxNumMove = 30;  // Maximum number of files that can be moved at once

    // Class names
    this.className = 'file-browser-container';
    this.actionsContainerClass = 'file-actions-container';
    this.tableContainerClass = 'file-browser-table-container';
    this.tableIconClass = 'icon';
    this.activeAjaxClass = 'ajax-active';
    this.searchInputClass = 'file-search-input';
    this.messageContainerClass = 'file-message-container';
    this.menuContainerClass =  'file-menu-container';
    this.searchContainerClass =  'file-search-container';
    this.stateManagerContainerClass = 'file-breadcrumbs-container';
    this.contextMenuClass = 'file-browser-context-menu';
    this.drowdownMenuButtonClass = 'dropdown-menu button';
    this.fileBrowserDialogClass = 'file-browser-dialog';

    this._dropdownMenuIcon = document.createElement('template');
    this._dropdownMenuIcon.innerHTML = icons.dropdownMenuIcon;
    this._dropdownMenuIcon.content.firstChild.classList.add(this.tableIconClass);

    this._carrotIcon = document.createElement('template');
    this._carrotIcon.innerHTML = icons.carrotIcon;
    this._carrotIcon.content.firstChild.classList.add(this.tableIconClass);
    this._carrotIcon.content.firstChild.classList.add('small');

    this._searchIcon = document.createElement('template');
    this._searchIcon.innerHTML = icons.searchIcon;
    this._searchIcon.content.firstChild.classList.add(this.tableIconClass);

    this._folderIcon = document.createElement('template');
    this._folderIcon.innerHTML = icons.folderIcon;
    this._folderIcon.content.firstChild.classList.add(this.tableIconClass);

    this._documentIcon = document.createElement('template');
    this._documentIcon.innerHTML = icons.documentIcon;
    this._documentIcon.content.firstChild.classList.add(this.tableIconClass);

    // Context menu
    this.contextMenu = this.createContextMenu();

    // Actions container
    this.actionsContainer = document.createElement('div');
    this.actionsContainer.className = this.actionsContainerClass;
    this.breadcrumbsContainer = this.createBreadcrumbs();
    this.messagesContainer = this.createMessages();
    this.menusContainer = this.createMenus();
    this.breadcrumbsContainer = this.createBreadcrumbs();
    this.searchContainer = this.createSearchElements();
    this.tableContainer = this.createTableContainer();

    // Add action elements
    this.actionsContainer.appendChild(this.breadcrumbsContainer);
    this.actionsContainer.appendChild(this.messagesContainer);
    this.actionsContainer.appendChild(this.menusContainer);
    this.actionsContainer.appendChild(this.searchContainer);

    this._element.appendChild(this.actionsContainer);
    this._element.appendChild(this.tableContainer);

    this.fileSystem = fileSystem;
    this.table = table;
    this.history = new History();
  }

  // getters

  static get type(){
    return 'div';
  }

  /**
   * An array of Column objects for the table.
   */
  get columns(){
    return [
      new Column(
        "",
        (element, rowData) => {
          // td = element
          let box = document.createElement('div');
          box.className = 'selected-box';

          element.appendChild(box);
        },
        null,
        1
      ),
      new Column(
        'Id',
        (element, rowData) => {
          element.innerText = rowData.id;
        },
        null,
        2,
        false
      ),
      new Column(
        'Name',
        (element, rowData) => {
          // Create icon
          let icon;
          let expandedImg;
          if (rowData.icon){
            icon = document.createElement('img');
            icon.width = 22;
            icon.height = 22;
            icon.className = this.tableIconClass;

            if (rowData.directory) {
              icon.src = rowData.icon;

            } else {
              icon.src = rowData.icon;

              // Create expanded image
              expandedImg = document.createElement('img');
              expandedImg.className = 'hover-image';
              expandedImg.style.display = 'none';

              icon.onmouseover = (event) => {
                if (expandedImg) {
                  expandedImg.src = rowData.url;
                }
                expandedImg.style.display = 'inline-block';
              };
              icon.onmouseout = () => {
                expandedImg.style.display = 'none';
              };
            }
          } else {
            if (rowData.directory){
              icon = this._folderIcon.content.cloneNode(true);
            } else {
              icon = this._documentIcon.content.cloneNode(true);
            }
            // icon.setAttribute('class', this.tableIconClass);
          }
          icon.ondragstart = () => {return false};
          element.appendChild(icon);
          if (expandedImg){
            element.appendChild(expandedImg);
          }

          // Create name
          let text = document.createTextNode(rowData.name || 'undefined');
          element.appendChild(text);
        },
        (rowData1, rowData2) => {
          return compareStrings(rowData1.name, rowData2.name)
        },
        8
      ),
      new Column(
        'Size',
        (element, rowData) => {
          if (rowData.directory) {
            element.innerText = '---';
          } else {
            let size = rowData.size;
            let readableSize;
            if (size){
              readableSize = convertBytesToReadable(size);
            }
            element.innerText = readableSize || '---';
          }
        },
        (rowData1, rowData2) => {
          return compareNumbers(rowData1.size, rowData2.size)
        },
        2
      ),
      new Column(
        'Last Modified',
        (element, rowData) => {
          element.innerText = new Date(rowData.lastModified).toLocaleString();
        },
        (rowData1, rowData2) => {
          return compareDateStrings(rowData1.lastModified, rowData2.lastModified)
        },
        4
      ),
      new Column(
        'Created',
        (element, rowData) => {
          element.innerText = new Date(rowData.created).toLocaleString();
        },
        (rowData1, rowData2) => {
          return compareDateStrings(rowData1.created, rowData2.created)
        },
        4
      ),
      new Column(
        'Type',
        (element, rowData) => {
          element.innerText = rowData.mimeType;
        },
        (rowData1, rowData2) => {
          return compareDateStrings(rowData1.mimeType, rowData2.mimeType)
        },
        4,
        false
      )
    ];
  }

  /**
   * The Table object for displaying the files.
   */
  get table(){
    return this._table;
  }

  /**
   * An instance of AbstractFileSystem to browse.
   */
  get fileSystem(){
    return this._fileSystem;
  }

  /**
   * The breadcrumbs showing the current path.
   */
  get history(){
    return this._history;
  }

  // setters

  set table(value){
    if (this._table){
      this.tableContainer.removeChild(this._table.element);
    }

    // Setup table
    this._table = value;
    this.syncTable();
    this.tableContainer.appendChild(this._table.element);
  }

  set fileSystem(value){
    // Setup storage
    this._fileSystem = value;
    this.syncFileSystem();
  }

  set history(value){
    if (this._history){
      this.actionsContainer.removeChild(this._history.element);
    }

    this._history = value;
    this.syncHistory();
    this.breadcrumbsContainer.appendChild(this._history.element);
  }

  clone(){
    return new this.constructor(this.fileSystem.clone(),
                                this.table.clone());
  }

  // Sync Elements

  syncFileSystemAndHistory(){
    if (this.fileSystem && this.history){
      this.history.path = this.fileSystem.path;
      this.fileSystem.onPathChanged = (path) => {
        this.history.path = path;
      };
    }
  }

  syncFileSystemAndTable(){
    if (this.fileSystem && this.table){
      this.setTableData(this.fileSystem.data);
      this.fileSystem.onDataChanged = (storageData) => {
        this.setTableData(storageData);
      };
      this.table.onDrop = (event) => {
        this.handleDataTransfer(event.dataTransfer);
      };
    }
  }

  syncFileSystem(){
    if (this.fileSystem){
      this.syncFileSystemAndHistory();
      this.syncFileSystemAndTable();
    }
  }

  syncHistory(){
    if (this.history){
      this.history.onClick = (path) => {
        this.goTo(path, true);
      };
      this.history.onDragOver = (path) => {
        this.goTo(path, true);
      };

      this.syncFileSystemAndHistory();
    }
  }

  syncTable(){
    if (this.table){
      this.table.columns = this.columns;
      this.table.onRowDblClick = (row, event) => {
        if (row.data.directory){
          this.goTo([row.data.name]);
        } else {
          if (row.data.url.startsWith('data')){
            // Download if its a data url.
            let link = document.createElement('a');
            link.href = row.data.url;
            link.setAttribute('download', row.data.name);
            link.click();
          } else {
            window.open(row.data.url);
          }
        }
      };
      this.table.onContextMenu = (event) => {
        this.showContextMenu(event.pageX, event.pageY);
      };
      this.table.onRowsChanged = (rows) => {
        for (let row of rows) {
          this.initializeNewRow(row);
        }
      };

      this.syncFileSystemAndTable();
    }
  }


  // Wrapper utilities


  async loadingWrapper(promise){
    // Add loading class to element while waiting on the async call.
    this.element.classList.add(this.activeAjaxClass);
    try {
      return await promise;
    } finally {
      this.element.classList.remove(this.activeAjaxClass);
    }
  }

  async errorLoggingWrapper(promise){
    // Catch and log any errors that happen during the execution of the call.
    // WARNING this will prevent and return value and error propagation.
    try{
      return await promise;
    } catch (error){
      this.addMessage(error, true);
    }
  }

  logAndLoadWrapper(promise){
    // Combine the actions in loadingWrapper and errorLoggingWrapper.
    // WARNING this will prevent and return value and error propagation.
    return this.loadingWrapper(this.errorLoggingWrapper(promise));
  }


  // Element Builders


  createContextMenu(){
    let contextMenu = new Dialog();
    contextMenu.name = "Settings";
    contextMenu.element.classList.add(this.contextMenuClass);
    return contextMenu;
  }

  createSearchElements(){
    let searchInput = document.createElement('input');
    searchInput.className = this.searchInputClass;
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
    searchContainer.className = this.searchContainerClass;
    searchContainer.appendChild(this._searchIcon.content.cloneNode(true));
    searchContainer.appendChild(searchInput);
    return searchContainer;
  }

  createMenus(){
    let menusContainer = document.createElement('div');
    menusContainer.className = this.menuContainerClass;
    let contextMenuButton = document.createElement('div');
    contextMenuButton.className = this.drowdownMenuButtonClass;
    contextMenuButton.appendChild(this._dropdownMenuIcon.content.cloneNode(true));
    contextMenuButton.appendChild(this._carrotIcon.content.cloneNode(true));
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

  createMessages(){
    let messageContainer = document.createElement('div');
    messageContainer.className = this.messageContainerClass;
    return messageContainer;
  }

  createTableContainer(){
    let tableContainer = document.createElement('div');
    tableContainer.className = this.tableContainerClass;
    return tableContainer;
  }

  createBreadcrumbs(){
    let breadcrumbsContainer = document.createElement('div');
    breadcrumbsContainer.className = this.stateManagerContainerClass;
    return breadcrumbsContainer;
  }

  initializeNewRow(row){
    row.hidden = row.data.name.startsWith('.');

    // When a directory is dragged over for a period of time, go to the directory.
    if (row.data.directory){
      row.addDragoverAction(() => {
        this.goTo([row.data.name]);
      });
    }
  }

  // Actions

  async handleDataTransfer(dataTransfer){
    // Called when item/items are dragged and dropped on the table
    this.clearMessages();

    let promises = [];

    for (let file of dataTransfer.files) {
      promises.push(this.fileSystem.addFile(this.fileSystem.path, file, file.name));
    }

    let uris = dataTransfer.getData("text/uri-list");
    if (uris) {
      let uriList = uris.split("\n");
      if (uriList.length.length > this.maxNumMove) {
        alert(`Cannot move more than ${this.maxNumMove} items.`);
      } else {
        for (let i = 0; i < uriList.length; i++) {
          let uri = uriList[i];
          if (!uri.startsWith("#")) {
            let splitUri = uri.split('/');
            if (splitUri.length > 0 && splitUri[splitUri.length-1].length < 255){
              promises.push(this.fileSystem.addFile(this.fileSystem.path, uri, splitUri[splitUri.length-1]));
            } else {
              promises.push(this.fileSystem.addFile(this.fileSystem.path, uri, 'unknown'));
            }
          }
        }
      }
    }

    this.logAndLoadWrapper(Promise.all(promises));

    let rowsText = dataTransfer.getData(this._table.dataTransferType);
    if (rowsText) {
      let rows = JSON.parse(rowsText);
      let names = [];
      let rowsToMove = [];
      for (let rowData of rows){
        if (!this.fileSystem.data[rowData.name]) {
          // Only move files that aren't already here.
          rowsToMove.push(rowData);
          names.push(rowData.name);
        }
      }
      if (rowsToMove.length > this.maxNumMove) {
        alert(`Cannot move more than ${this.maxNumMove} items.`);
      } else if (rowsToMove.length > 0){
        let moveConfirmDialog = new ConfirmDialog();
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
            let moveFile = async (rowData) => {
              let fileObject = await this.fileSystem.getFileObject(rowData.path);
              return await this.fileSystem.move(this.fileSystem.path, fileObject);
            };
            promises.push(moveFile(rowData));
          }
          this.logAndLoadWrapper(Promise.all(promises));
          this.contextMenu.close();
        };
        moveConfirmDialog.items = [confirmText];
        moveConfirmDialog.show();
      }
    }
  }

  async search(searchTerm) {
    this.clearMessages();
    if (searchTerm){
      try{
        let data = await this.loadingWrapper(this.fileSystem.search(this.fileSystem.path, searchTerm));
        this.setTableData(data);
        let readablePath = [this.history.baseName].concat(this.fileSystem.path).join('/');
        this.addMessage(
          `${data.length} search results for "${searchTerm}" in ${readablePath}.`
        );
      } catch (error) {
        this.addMessage(error, true);
      }
    } else {
      this.setTableData(this.fileSystem.data);
    }
  }

  /**
   * Translate the data for a FileObject to the data that will be in each table row for that file.
   * @param {FileObject} fileObject - The file for a given row.
   * @returns {Object} - The data for that row in the table.
   */
  fileObjectToTableData(fileObject){
    return {
      id: fileObject.fileNode.id,
      path: fileObject.path,
      name: fileObject.fileNode.name,
      directory: fileObject.fileNode.directory,
      url: fileObject.fileNode.url,
      icon: fileObject.fileNode.icon,
      mimeType: fileObject.fileNode.mimeType,
      lastModified: fileObject.fileNode.lastModified,
      created: fileObject.fileNode.created,
      size: fileObject.fileNode.size
    }
  }

  setTableData(storageData){
    let tableData = [];
    for (let fileObject of storageData){
      tableData.push(this.fileObjectToTableData(fileObject));
    }
    this.table.data = tableData;
  }

  showContextMenu(positionX, positionY){
    let selectedData = this._table.selectedData;

    // Add the items to the context menu
    this.contextMenu.items = this.getMenuItems(selectedData);

    // Move the context menu to the click position
    this.contextMenu.move(positionX, positionY);

    this.contextMenu.show();
  }

  getMenuItems(selectedData) {
    let menuItems = [];

    // Add items that should exist only when there is selected data.
    if (selectedData.size > 0){
      // Add items that should exist only when there is one selected item.
      if (selectedData.size === 1) {
        let selectedRowData = selectedData.values().next().value;

        // Add an open button to navigate to the selected item.
        let openButton = document.createElement('div');
        openButton.innerText = 'Open';
        openButton.onclick = () => {
          if (selectedRowData.directory) {
            this.goTo([selectedRowData.name]);
          } else {
            window.open(selectedRowData.url);
          }
          this.contextMenu.close();
        };
        menuItems.push(openButton);

        if (selectedRowData.url){
          let urlButton = document.createElement('div');
          urlButton.innerText = 'Copy Url';
          urlButton.onclick = () => {
            let urlText = document.createElement('textarea');
            // urlText.style.display = 'none';
            urlButton.appendChild(urlText);
            urlText.innerText = selectedRowData.url;
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
                this.contextMenu.close();
                let fileObject = await this.fileSystem.getFileObject(selectedRowData.path);
                await fileObject.rename(newName);
                await this.fileSystem.refresh();
              }
            })()
          );
        };
        menuItems.push(renameButton);

        if (selectedRowData.mimeType === 'application/javascript'){
          let runButton = document.createElement('div');
          runButton.innerText = 'Run';
          runButton.onclick = () => {
            this.errorLoggingWrapper(
              (async () => {
                await this.fileSystem.execPath(selectedRowData.path);
              })()
            );
          };
          menuItems.push(runButton);
        }
      }

      // Add a delete button that when clicked will delete open another dialog
      // to confirm deletion which from there will delete all selected items.
      let deleteButton = document.createElement('div');
      deleteButton.innerText = 'Delete';
      deleteButton.onclick = () => {
        event.preventDefault();
        event.stopPropagation(); // Prevent from closing new dialog immediately

        let deleteDialog = new ConfirmDialog(this.contextMenu);
        deleteDialog.onClose = () => {
          deleteDialog.remove();
        };
        let removeText = document.createElement('div');
        let names = [];
        for (let dataItem of selectedData){
          names.push(dataItem.name);
        }
        removeText.innerText = `Are you sure you want to remove ${names.join(', ')}?`;
        let promises = [];
        deleteDialog.onConfirmed = () => {
          this.logAndLoadWrapper(
            (async () => {
              for (let rowData of selectedData) {
                let fileObject = await this.fileSystem.getFileObject(rowData.path);
                promises.push(fileObject.delete());
              }
              this.contextMenu.close();
              await Promise.all(promises);
              await this.fileSystem.refresh();
            })()
          );
        };
        deleteDialog.items = [removeText];
        deleteDialog.show();
      };
      menuItems.push(deleteButton);

      // Add a move button that when clicked which opens a new menu with a nested file browser
      // copied from this file browser to get the target path. The selected files will get moved
      // to the target when selected.
      if (selectedData.size <= 30){
        let moveButton = document.createElement('div');
        moveButton.innerText = 'Move';
        moveButton.onclick = (event) => {
          // Prevent from closing dialog immediately due to outside click
          event.preventDefault();
          event.stopPropagation();

          let moveBrowser = new DialogBrowser(this.fileSystem.clone(), this.table.clone());
          moveBrowser.table.selectMultiple = false;
          moveBrowser.dialog.parent = this.contextMenu;
          moveBrowser.dialog.name = "Move Files";
          moveBrowser.dialog.element.classList.add(this.fileBrowserDialogClass);
          moveBrowser.dialog.confirmationText = "Select";
          moveBrowser.dialog.onConfirmed = () => {
            this.logAndLoadWrapper(
              (async () => {
                let path = moveBrowser.fileSystem.path;
                if (moveBrowser.table.selectedData.size === 1){
                  let selectedName = moveBrowser.table.selectedData.values().next().value.name;
                  path.push(selectedName);
                }

                let movePromises = [];
                for (let rowData of selectedData) {
                  let fileObject = await moveBrowser.fileSystem.getFileObject(rowData.path);
                  movePromises.push(moveBrowser.fileSystem.move(path, fileObject));
                }
                await Promise.all(movePromises);
                await this.fileSystem.refresh();
              })()
            );
          };

          moveBrowser.dialog.onClose = (dialog) => {
            moveBrowser.dialog.remove();
          };
          moveBrowser.dialog.onRemove = () => {
            moveBrowser.contextMenu.remove(); // Make sure associated context menu gets removed.
          };
          moveBrowser.dialog.show();
        };
        menuItems.push(moveButton);
      }
    }

    let addFileButton = document.createElement('div');
    addFileButton.innerText = 'Add File';
    addFileButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation(); // Prevent from closing new dialog immediately

      let fileDialog = new ConfirmDialog(this.contextMenu);
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
        this.logAndLoadWrapper(
          (async () => {
            let promises = [];
            for (let file of fileInput.files) {
              promises.push(this.fileSystem.addFile(this.fileSystem.path, file));
            }
            this.contextMenu.close();

            await Promise.all(promises);
          })()
        );
      };

      fileDialog.items = [fileInputDiv];
      fileDialog.show();
    };
    menuItems.push(addFileButton);

    let addDirectoryButton = document.createElement('div');
    addDirectoryButton.innerText = 'Add Directory';
    addDirectoryButton.onclick = () => {
      let name = prompt("Directory Name");
      if (name !== null){
        this.logAndLoadWrapper(this.fileSystem.addDirectory(this.fileSystem.path, name));
      }
      this.contextMenu.close();
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

      this.table.visibleColumnsDialog.show();
    };
    menuItems.push(visibleColumnsButton);

    return menuItems;
  }

  addMessage(message, isError) {
    console.log(message);
    let errorMessage;
    if (message instanceof Error){
      errorMessage = new Message(message.message, true, this.messageRemovalDelay);
    } else {
      errorMessage = new Message(message.toString(), isError, this.messageRemovalDelay);
    }
    this.messagesContainer.appendChild(errorMessage.element);
  }

  clearMessages() {
    while (this.messagesContainer.firstChild) {
      this.messagesContainer.removeChild(this.messagesContainer.firstChild);
    }
  }

  goTo(path, absolute){
    if (!absolute){
      path = this.fileSystem.path.concat(path);
    }
    // If name is not provided, will refresh the current location
    this.clearMessages();
    this.element.classList.remove(this.dragOverClass);
    this.logAndLoadWrapper(this.fileSystem.changeDirectory(path));
  }
}


export class DialogBrowser extends FileBrowser {
  /**
   * An file browser inside a dialog.
   */
  constructor(fileSystem, table, dialog){
    // Dialog must be created before browser element any child dialogs for proper order in dom to appear on top
    dialog = dialog || new ConfirmDialog();

    super(fileSystem, table);

    this._dialog = dialog;
    this.contextMenu.parent = this._dialog;
    this.table.visibleColumnsDialog.parent = this._dialog;
    this._dialog.items = [this.element];
  }

  get dialog(){
    return this._dialog;
  }
}

export let ConfigFileMixin = (fileSystemClass) => {
  return class extends fileSystemClass {
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
            this.setTableData(Object.values(this.fileSystem.data)); // Refresh data to resort with default sort
          }
        }
      }
    }

    syncTable() {
      super.syncTable();
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
          await this.fileSystem.getFileObject(checked);
        } catch (error) {
          if (error instanceof FileNotFoundError){
            await this.fileSystem.addDirectory(checked.slice(0, checked.length - 1), checked[checked.length-1]);
          } else {
            throw error;
          }
        }
      }
      await this.fileSystem.addFile(checked, new File([""], name, {type: 'text/plain'}), name);
    }

    async addLocalConfig(newConfig){
      let dataBuffer;
      try {
        let configFileObject = await this.fileSystem.getFileObject(this.constructor.localConfigPath);
        let oldDataBuffer = await configFileObject.read();
        dataBuffer = updateConfigFile(newConfig, oldDataBuffer);
      } catch (error) {
        if (error instanceof FileNotFoundError){
          await this.fileSystem.waitOn(this.addLocalConfigFile.bind(this))();
        }
        dataBuffer = updateConfigFile({});
      }

      try{
        await this.fileSystem.write(this.constructor.localConfigPath, dataBuffer);
      } catch (e) {
        if (e instanceof FileNotFoundError){
          await this.fileSystem.write(this.constructor.localConfigPath, dataBuffer);
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
          let configFileObject = await this.fileSystem.getFileObject(path);
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
