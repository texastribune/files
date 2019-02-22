"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const breadCrumbs_1 = require("./breadCrumbs");
const base_1 = require("../files/base");
const utils_1 = require("../utils");
const icons = __importStar(require("./icons.js"));
const config_1 = require("./config");
const dialog_1 = require("elements/lib/dialog");
const table_1 = require("elements/lib/table");
const memory_1 = require("../files/memory");
const proxy_1 = require("../files/proxy");
const element_1 = require("elements/lib/element");
class FileTableRow extends table_1.Row {
    constructor() {
        super(...arguments);
        this.file = null;
    }
    getFile() {
        return this.file;
    }
    setFile(value) {
        this.file = value;
        let idColumn = document.createElement('table-data');
        let nameColumn = document.createElement('table-data');
        let sizeColumn = document.createElement('table-data');
        let lastModifiedColumn = document.createElement('table-data');
        let createdColumn = document.createElement('table-data');
        let typeColumn = document.createElement('table-data');
        this.hidden = this.file.name.startsWith('.');
        idColumn.innerText = value.id;
        nameColumn.innerText = value.name;
        sizeColumn.innerText = utils_1.convertBytesToReadable(value.size);
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
class FileTableHeader extends table_1.Header {
    constructor() {
        super();
    }
    refresh() {
        super.refresh();
        let idColumn = document.createElement('table-data');
        let nameColumn = document.createElement('table-data');
        let sizeColumn = document.createElement('table-data');
        let lastModifiedColumn = document.createElement('table-data');
        let createdColumn = document.createElement('table-data');
        let typeColumn = document.createElement('table-data');
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
class FileBrowser extends element_1.CustomElement {
    constructor() {
        super();
        this.searchPending = false; // For search debounce
        this.messageRemovalDelay = null;
        this.maxNumMove = 30; // Maximum number of files that can be moved at once
        // Sub elements
        this.table = document.createElement('selectable-table');
        this.breadCrumbs = document.createElement('bread-crumbs');
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
        this.fileContextMenu = document.createElement('base-dialog');
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
        this.table.oncontextmenu = (event) => {
            event.preventDefault();
            this.showContextMenu(event.pageX, event.pageY);
        };
        this.table.ondrop = (event) => {
            if (event.dataTransfer !== null) {
                this.handleDataTransfer(event.dataTransfer);
            }
        };
        let tableHeader = document.createElement('file-header');
        this.table.appendChild(tableHeader);
        this.breadCrumbs.addEventListener(breadCrumbs_1.BreadCrumbs.EVENT_PATH_CHANGE, (event) => {
            this.path = this.breadCrumbs.path;
        });
        this.busy = Promise.resolve();
        this.currentDirectory = new proxy_1.CachedProxyDirectory(new memory_1.MemoryDirectory(null, 'root'));
    }
    static get observedAttributes() {
        return [];
    }
    updateAttributes(attributes) {
    }
    static createIconTemplate(icon) {
        let template = document.createElement('template');
        template.innerHTML = icon;
        return template.content.firstChild;
    }
    get rootDirectory() {
        return this.currentDirectory.root;
    }
    set rootDirectory(value) {
        console.log("SET ROOT", value, value.getChildren().then((val) => console.log(val)));
        this.currentDirectory = new proxy_1.CachedProxyDirectory(value);
        this.refreshFiles();
    }
    get path() {
        return this.currentDirectory.path.slice(1).reduce((pathArray, directory) => {
            pathArray.push(directory.name);
            return pathArray;
        }, []);
    }
    set path(path) {
        console.log("SET PATH", path);
        this.busy = this.busy
            .then(() => {
            return this.logAndLoadWrapper(this.currentDirectory.root.getFile(path)
                .then((newDirectory) => {
                console.log("NEW DIR", newDirectory);
                if (newDirectory instanceof proxy_1.CachedProxyDirectory) {
                    this.currentDirectory = newDirectory;
                }
                else {
                    throw new base_1.FileNotFoundError("file must be a directory");
                }
                this.breadCrumbs.path = path;
                return this.currentDirectory.getChildren();
            })
                .then((files) => {
                this.setTableData(files);
            }));
        });
    }
    get css() {
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
    render(shadowRoot) {
        super.render(shadowRoot);
        shadowRoot.appendChild(this.breadCrumbs);
        shadowRoot.appendChild(this.actionsContainer);
        shadowRoot.appendChild(this.tableContainer);
        shadowRoot.appendChild(this.fileContextMenu);
    }
    // Wrapper utilities
    loadingWrapper(promise) {
        return __awaiter(this, void 0, void 0, function* () {
            // Add loading class to element while waiting on the async call.
            this.classList.add(FileBrowser.activeAjaxClass);
            try {
                return yield promise;
            }
            finally {
                this.classList.remove(FileBrowser.activeAjaxClass);
            }
        });
    }
    errorLoggingWrapper(promise) {
        return __awaiter(this, void 0, void 0, function* () {
            // Catch and log any errors that happen during the execution of the call.
            // WARNING this will prevent and return value and error propagation.
            try {
                return yield promise;
            }
            catch (error) {
                this.addMessage(error, true);
            }
        });
    }
    logAndLoadWrapper(promise) {
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
        console.log("BUTOTN", contextMenuButton);
        contextMenuButton.onclick = (event) => {
            event.stopPropagation();
            console.log("CLICK");
            let rect = contextMenuButton.getBoundingClientRect();
            let scrollLeft = document.documentElement.scrollLeft;
            let scrollTop = document.documentElement.scrollTop;
            this.showContextMenu(rect.left + scrollLeft, rect.bottom + scrollTop);
        };
        menusContainer.appendChild(contextMenuButton);
        return menusContainer;
    }
    // Actions
    handleDataTransfer(dataTransfer) {
        return __awaiter(this, void 0, void 0, function* () {
            // Called when item/items are dragged and dropped on the table
            this.clearMessages();
            let promises = [];
            for (let file of dataTransfer.files) {
                promises.push(utils_1.fileToArrayBuffer(file).then((buffer) => {
                    return this.currentDirectory.addFile(buffer, file.name, file.type);
                }));
            }
            let uris = dataTransfer.getData("text/uri-list");
            if (uris) {
                let uriList = uris.split("\n");
                if (uriList.length > this.maxNumMove) {
                    alert(`Cannot move more than ${this.maxNumMove} items.`);
                }
                else {
                    for (let i = 0; i < uriList.length; i++) {
                        let uri = uriList[i];
                        if (!uri.startsWith("#")) {
                            let splitUri = uri.split('/');
                            if (splitUri.length > 0 && splitUri[splitUri.length - 1].length < 255) {
                                promises.push(this.currentDirectory.addFile(uri, splitUri[splitUri.length - 1]));
                            }
                            else {
                                promises.push(this.currentDirectory.addFile(uri, 'unknown'));
                            }
                        }
                    }
                }
            }
            this.logAndLoadWrapper(Promise.all(promises).then(() => { }));
            let rowsText = dataTransfer.getData(table_1.Table.dataTransferType);
            if (rowsText) {
                let rows = JSON.parse(rowsText);
                let names = [];
                let rowsToMove = [];
                for (let rowData of rows) {
                    names.push(rowData.name);
                }
                if (rowsToMove.length > this.maxNumMove) {
                    alert(`Cannot move more than ${this.maxNumMove} items.`);
                }
                else if (rowsToMove.length > 0) {
                    let moveConfirmDialog = document.createElement('confirm-dialog');
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
                            let moveFile = (rowData) => __awaiter(this, void 0, void 0, function* () {
                                let fileObject = yield this.currentDirectory.getFile(rowData.path);
                                return yield this.currentDirectory.move(fileObject);
                            });
                            promises.push(moveFile(rowData));
                        }
                        this.logAndLoadWrapper(Promise.all(promises).then(() => { }));
                        this.fileContextMenu.visible = false;
                    };
                    moveConfirmDialog.appendChild(confirmText);
                    moveConfirmDialog.visible = true;
                }
            }
        });
    }
    search(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            this.clearMessages();
            if (searchTerm) {
                yield this.loadingWrapper(this.currentDirectory.search(searchTerm).then((foundFiles) => {
                    this.setTableData(foundFiles);
                    let readablePath = [this.breadCrumbs.baseName].concat(this.path).join('/');
                    this.addMessage(`${foundFiles.length} search results for "${searchTerm}" in ${readablePath}.`);
                }));
            }
            else {
                yield this.loadingWrapper(this.currentDirectory.getChildren().then((children) => {
                    this.setTableData(children);
                }));
            }
        });
    }
    /**
     * Translate the data for a AbstractFile to the data that will be in each table row for that file.
     */
    fileObjectToTableRow(fileObject) {
        let tableRow = document.createElement('file-row');
        tableRow.setFile(fileObject);
        if (fileObject.directory) {
            tableRow.addDragoverAction(() => {
                this.path = this.path.concat([fileObject.name]);
            });
        }
        return tableRow;
    }
    setTableData(files) {
        let tableRows = [];
        for (let fileObject of files) {
            let newRow = this.fileObjectToTableRow(fileObject);
            newRow.hidden = fileObject.name.startsWith('.');
            // When a directory is dragged over for a period of time, go to the directory.
            if (fileObject instanceof base_1.Directory) {
                newRow.addDragoverAction(() => {
                    this.path = this.path.concat([fileObject.name]);
                });
                newRow.ondblclick = (event) => {
                    // Goto directory
                    this.path = this.path.concat([fileObject.name]);
                };
            }
            else {
                newRow.ondblclick = (event) => {
                    // go to url (if dataurl download)
                    if (fileObject.url !== null) {
                        if (fileObject.url.startsWith('data')) {
                            // Download if its a data url.
                            let link = document.createElement('a');
                            link.href = fileObject.url || "";
                            link.setAttribute('download', fileObject.name);
                            link.click();
                        }
                        else {
                            window.open(fileObject.url);
                        }
                    }
                };
            }
            tableRows.push(newRow);
        }
        this.table.rows = tableRows;
    }
    showContextMenu(positionX, positionY) {
        console.log("SHOW");
        // Add the items to the context menu
        this.fileContextMenu.removeChildren();
        let selectedFileRows = [];
        for (let row of this.table.selectedRows) {
            if (row instanceof FileTableRow) {
                selectedFileRows.push(row);
            }
        }
        this.fileContextMenu.appendChildren(this.getMenuItems(selectedFileRows));
        // Move the context menu to the click position
        this.fileContextMenu.position = { x: positionX, y: positionY };
        this.fileContextMenu.velocity = { x: 0, y: 0 };
        this.fileContextMenu.visible = true;
        console.log("POS", positionY, positionX);
    }
    getMenuItems(selectedFileRows) {
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
                        }
                        else {
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
                        this.logAndLoadWrapper((() => __awaiter(this, void 0, void 0, function* () {
                            let newName = prompt("New Name");
                            if (newName !== null) {
                                this.fileContextMenu.visible = false;
                                yield selectedFile.rename(newName);
                                yield this.refreshFiles();
                            }
                        }))());
                    };
                    menuItems.push(renameButton);
                    if (selectedFile.mimeType === 'application/javascript') {
                        let runButton = document.createElement('div');
                        runButton.innerText = 'Run';
                        runButton.onclick = () => {
                            this.errorLoggingWrapper((() => __awaiter(this, void 0, void 0, function* () {
                                yield this.currentDirectory.execPath(selectedRowData.path);
                            }))());
                        };
                        menuItems.push(runButton);
                    }
                }
            }
            // Add a delete button that when clicked will delete open another dialog
            // to confirm deletion which from there will delete all selected items.
            let deleteButton = document.createElement('div');
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation(); // Prevent from closing new dialog immediately
                let deleteDialog = document.createElement('confirm-dialog');
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
                let promises = [];
                deleteDialog.onConfirmed = () => {
                    this.logAndLoadWrapper((() => __awaiter(this, void 0, void 0, function* () {
                        for (let row of selectedFileRows) {
                            let file = row.getFile();
                            if (file !== null) {
                                promises.push(file.delete());
                            }
                        }
                        this.fileContextMenu.visible = false;
                        yield Promise.all(promises);
                        yield this.currentDirectory.clearCache();
                    }))());
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
                    let moveBrowser = document.createElement('file-browser');
                    moveBrowser.rootDirectory = this.rootDirectory;
                    let moveDialog = document.createElement('confirm-dialog');
                    moveBrowser.table.selectMultiple = false;
                    moveDialog.name = "Move Files";
                    moveDialog.classList.add(this.fileBrowserDialogClass);
                    moveDialog.confirmationText = "Select";
                    moveDialog.onConfirmed = () => {
                        this.logAndLoadWrapper((() => __awaiter(this, void 0, void 0, function* () {
                            let path = moveBrowser.currentDirectory.path;
                            if (moveBrowser.table.selectedRows.length === 1) {
                                let selectedName = moveBrowser.table.selectedData.values().next().value.name;
                                path.push(selectedName);
                            }
                            let movePromises = [];
                            for (let rowData of selectedFileRows) {
                                let fileObject = yield moveBrowser.currentDirectory.getFile(rowData.path);
                                movePromises.push(moveBrowser.currentDirectory.move(path, fileObject).then(() => { }));
                            }
                            yield Promise.all(movePromises);
                            yield this.refreshFiles();
                        }))());
                    };
                    this.fileContextMenu.appendChild(moveDialog);
                    moveDialog.addEventListener(dialog_1.Dialog.EVENT_CLOSED, () => {
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
            let fileDialog = document.createElement('confirm-dialog');
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
                        promises.push(utils_1.fileToArrayBuffer(file).then((buffer) => {
                            return this.currentDirectory.addFile(buffer, file.name, file.type);
                        }));
                    }
                }
                this.fileContextMenu.visible = false;
                this.logAndLoadWrapper(Promise.all(promises).then(() => { }));
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
                this.logAndLoadWrapper(this.currentDirectory.addDirectory(name).then(() => { }));
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
    addMessage(message, isError) {
        console.log(message);
        let errorMessage = document.createElement('user-message');
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
    refreshFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentDirectory.clearCache();
            let children = yield this.currentDirectory.getChildren();
            console.log("CHILDREN", children, this.currentDirectory);
            yield this.setTableData(children);
        });
    }
}
// Class names
FileBrowser.actionsContainerClass = 'file-actions-container';
FileBrowser.tableContainerClass = 'file-browser-table-container';
FileBrowser.tableIconClass = 'icon';
FileBrowser.activeAjaxClass = 'ajax-active';
FileBrowser.searchInputClass = 'file-search-input';
FileBrowser.messageContainerClass = 'file-message-container';
FileBrowser.menuContainerClass = 'file-menu-container';
FileBrowser.searchContainerClass = 'file-search-container';
FileBrowser.stateManagerContainerClass = 'file-breadcrumbs-container';
FileBrowser.dropdownMenuButtonClass = 'dropdown-menu button';
FileBrowser.fileBrowserDialogClass = 'file-browser-dialog';
exports.FileBrowser = FileBrowser;
class DialogBrowser extends FileBrowser {
    /**
     * An file browser inside a dialog.
     */
    constructor(currentDirectory, table, dialog) {
        // Dialog must be created before browser element any child dialogs for proper order in dom to appear on top
        dialog = dialog || new dialog_1.ConfirmDialog();
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
exports.DialogBrowser = DialogBrowser;
exports.ConfigFileMixin = (currentDirectoryClass) => {
    return class extends currentDirectoryClass {
        constructor(...args) {
            super(...args);
            this.logAndLoadWrapper(this.getConfig()
                .then((config) => {
                try {
                    this.config = config;
                }
                catch (e) {
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
                    defualtSortColumn = defualtSortColumn.slice(1);
                }
                for (let column of this.table.columns) {
                    if (column.name === defualtSortColumn) {
                        let func;
                        if (column.sortCompare && reverse) {
                            func = (...args) => {
                                return -column.sortCompare(...args);
                            };
                        }
                        else {
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
                        this.addLocalConfig({ visibleColumns: visibleColumnNames.join(',') })
                            .then()
                            .catch((error) => {
                            console.log(`Error adding config: ${error}`);
                        });
                    };
                }
            }
        }
        addLocalConfigFile() {
            return __awaiter(this, void 0, void 0, function* () {
                let path = this.constructor.localConfigPath.slice();
                let name = path.pop();
                let checked = [];
                while (path.length > 0) {
                    checked.push(path.shift());
                    try {
                        yield this.currentDirectory.getFile(checked);
                    }
                    catch (error) {
                        if (error instanceof base_1.FileNotFoundError) {
                            yield this.currentDirectory.addDirectory(checked.slice(0, checked.length - 1), checked[checked.length - 1]);
                        }
                        else {
                            throw error;
                        }
                    }
                }
                yield this.currentDirectory.addFile(checked, new File([""], name, { type: 'text/plain' }), name);
            });
        }
        addLocalConfig(newConfig) {
            return __awaiter(this, void 0, void 0, function* () {
                let dataBuffer;
                try {
                    let configFileObject = yield this.currentDirectory.getFile(this.constructor.localConfigPath);
                    let oldDataBuffer = yield configFileObject.read();
                    dataBuffer = config_1.updateConfigFile(newConfig, oldDataBuffer);
                }
                catch (error) {
                    if (error instanceof base_1.FileNotFoundError) {
                        yield this.currentDirectory.waitOn(this.addLocalConfigFile.bind(this))();
                    }
                    dataBuffer = config_1.updateConfigFile({});
                }
                try {
                    yield this.currentDirectory.write(this.constructor.localConfigPath, dataBuffer);
                }
                catch (e) {
                    if (e instanceof base_1.FileNotFoundError) {
                        yield this.currentDirectory.write(this.constructor.localConfigPath, dataBuffer);
                    }
                }
            });
        }
        getConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                let config = {};
                let configPath = this.constructor.configPaths.slice();
                let configFile = null;
                while (configFile === null && configPath.length > 0) {
                    let path = configPath.shift();
                    let localConfig;
                    try {
                        let configFileObject = yield this.currentDirectory.getFile(path);
                        let data = yield configFileObject.read();
                        localConfig = config_1.parseConfigFile(data);
                    }
                    catch (error) {
                        console.log(`Could not get config file at /${path.join('/')}: ${error}`);
                        localConfig = {};
                    }
                    Object.assign(config, localConfig);
                }
                return config;
            });
        }
    };
};
customElements.define('file-browser', FileBrowser);
customElements.define('file-row', FileTableRow);
customElements.define('file-header', FileTableHeader);
