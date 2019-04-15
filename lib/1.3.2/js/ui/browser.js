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
// import modules to define custom elements
require("./breadCrumbs");
require("./messages");
require("./search");
require("./contextMenu");
require("elements/lib/table");
require("elements/lib/dialog");
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
const search_1 = require("./search");
const base_2 = require("../processes/base");
const console_1 = require("../devices/console");
const contextMenu_1 = require("./contextMenu");
class FileTableRow extends table_1.Row {
    constructor() {
        super();
        this._file = null;
        this._path = null;
        this.folderIcon = utils_1.createNode(icons.folderIcon);
        this.folderIcon.classList.add(FileBrowser.tableIconClass);
        this.documentIcon = utils_1.createNode(icons.documentIcon);
        this.documentIcon.classList.add(FileBrowser.tableIconClass);
    }
    get css() {
        // language=CSS
        return super.css + `
        :host(.${FileTableRow.pendingActionClass}) {
            animation-name: pending-action;
            animation-delay: 1s;
            animation-duration: 2s;
        }
        @keyframes pending-action {
            to {background-color: var(--table-selected-item-color, #5d91e5)}
        }
    `;
    }
    get file() {
        return this._file;
    }
    set file(value) {
        let idColumn = document.createElement('table-data');
        let nameColumn = document.createElement('table-data');
        let sizeColumn = document.createElement('table-data');
        let lastModifiedColumn = document.createElement('table-data');
        let createdColumn = document.createElement('table-data');
        let typeColumn = document.createElement('table-data');
        this._file = value;
        if (this._file !== null) {
            this.hidden = this._file.name.startsWith('.');
            idColumn.innerText = this._file.id;
            sizeColumn.innerText = utils_1.convertBytesToReadable(this._file.size);
            lastModifiedColumn.innerText = new Date(this._file.lastModified).toLocaleString();
            createdColumn.innerText = new Date(this._file.created).toLocaleString();
            typeColumn.innerText = this._file.mimeType;
            // Name column
            if (this._file.icon !== null) {
                let img = document.createElement('img');
                img.width = 22;
                img.height = 22;
                img.ondragstart = () => {
                    return false;
                };
                img.classList.add(FileBrowser.tableIconClass);
                nameColumn.appendChild(img);
                if (this._file.directory) {
                    img.src = this._file.icon;
                }
                else {
                    img.src = this._file.icon;
                    // Create expanded image
                    let expandedImg = document.createElement('img');
                    expandedImg.className = FileTableRow.hoverImageClass;
                    expandedImg.style.display = 'none';
                    img.onmouseover = (event) => {
                        if (this._file !== null && this._file.url !== null) {
                            console.log("URL", this._file.url);
                            expandedImg.src = this._file.url;
                        }
                        expandedImg.style.display = 'inline-block';
                    };
                    img.onmouseout = () => {
                        expandedImg.style.display = 'none';
                    };
                    nameColumn.appendChild(expandedImg);
                }
            }
            else if (this._file instanceof base_1.Directory) {
                nameColumn.appendChild(this.folderIcon);
            }
            else {
                nameColumn.appendChild(this.documentIcon);
            }
            let text = document.createTextNode(this._file.name);
            nameColumn.appendChild(text);
        }
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
    get path() {
        return this._path;
    }
    set path(value) {
        this._path = value;
    }
    handleDragStart(event) {
        super.handleDragStart(event);
        if (event.dataTransfer !== null && this._path !== null) {
            let dataTransfer = {
                move: [this._path],
                copy: [],
            };
            event.dataTransfer.setData(FileBrowser.dataTransferType, JSON.stringify(dataTransfer));
            event.dataTransfer.dropEffect = 'move';
        }
    }
}
FileTableRow.hoverImageClass = 'hover-image';
exports.FileTableRow = FileTableRow;
class FileTableHeader extends table_1.Header {
    constructor() {
        super();
    }
    render(shadowRoot) {
        super.render(shadowRoot);
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
function isFileTransfer(object) {
    function validArrayOfPaths(array) {
        for (let path of array) {
            if (!(path instanceof Array)) {
                return false;
            }
            for (let segment in path) {
                if (typeof segment !== "string") {
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
 * An element for browsing a file system.
 * @param {Directory} currentDirectory - The root directory of the browser.
 * @param {Table} table - The table to use for displaying the files.
 */
class FileBrowser extends element_1.CustomElement {
    constructor() {
        super();
        this.maxNumMove = 30; // Maximum number of files that can be moved at once
        this.maxNumCopy = 30; // Maximum number of files that can be copied at once
        this.activePromises = new Set();
        this.cachedCurrentDirectory = new proxy_1.CachedProxyDirectory(new memory_1.MemoryDirectory(null, 'root'));
        // Sub elements
        this.table = this.getNewTable();
        this.table.setAttribute('select-multiple', "");
        this.breadCrumbs = this.getNewBreadCrumbs();
        this.dropdownMenuIcon = utils_1.createNode(icons.dropdownMenuIcon);
        this.dropdownMenuIcon.classList.add(FileBrowser.tableIconClass);
        this.carrotIcon = utils_1.createNode(icons.carrotIcon);
        this.carrotIcon.classList.add(FileBrowser.tableIconClass);
        this.carrotIcon.classList.add('small');
        // Actions container
        this.actionsContainer = document.createElement('div');
        this.actionsContainer.className = FileBrowser.actionsContainerClass;
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = FileBrowser.messageContainerClass;
        this.menusContainer = document.createElement('div');
        this.menusContainer.className = FileBrowser.menuContainerClass;
        let contextMenuButton = document.createElement('div');
        contextMenuButton.className = FileBrowser.buttonClass;
        contextMenuButton.appendChild(this.dropdownMenuIcon.cloneNode(true));
        contextMenuButton.appendChild(this.carrotIcon.cloneNode(true));
        contextMenuButton.onclick = (event) => {
            event.stopPropagation();
            let rect = contextMenuButton.getBoundingClientRect();
            this.showContextMenu(rect.left - document.documentElement.scrollLeft, rect.bottom - document.documentElement.scrollTop);
        };
        this.menusContainer.appendChild(contextMenuButton);
        this.searchElement = document.createElement('search-bar');
        // Table
        this.tableContainer = document.createElement('div');
        this.tableContainer.className = FileBrowser.tableContainerClass;
        this.tableBusyOverlay = document.createElement('div');
        this.tableContainer.appendChild(this.table);
        this.tableContainer.appendChild(this.tableBusyOverlay);
        // Add action elements
        this.actionsContainer.appendChild(this.breadCrumbs);
        this.actionsContainer.appendChild(this.messagesContainer);
        this.actionsContainer.appendChild(this.menusContainer);
        this.actionsContainer.appendChild(this.searchElement);
        let tableHeader = this.getNewFileTableHeader();
        this.table.appendChild(tableHeader);
        // Element events
        document.addEventListener('copy', (event) => {
            if (this.table.selectedRows.length > 0) {
                this.onCutOrCopy(event);
            }
        });
        document.addEventListener('cut', (event) => {
            if (this.table.selectedRows.length > 0) {
                this.onCutOrCopy(event);
            }
        });
        this.addEventListener('paste', (event) => {
            this.onPaste(event);
        });
        this.table.ondrop = (event) => {
            if (event.dataTransfer !== null) {
                this.handleDataTransfer(event.dataTransfer);
            }
        };
        this.table.addEventListener(table_1.Table.EVENT_SELECTION_CHANGED, () => {
            let event = new Event(FileBrowser.EVENT_SELECTED_FILES_CHANGE);
            this.dispatchEvent(event);
        });
        this.ondblclick = (event) => {
            // if a file row is double clicked
            let fileRow = utils_1.getFirstInPath(event, FileTableRow);
            if (fileRow !== null) {
                this.onFileRowDoubleClick(fileRow);
            }
        };
        this.searchElement.addEventListener(search_1.SearchBar.EVENT_SEARCH_CHANGE, () => {
            this.search(this.searchElement.value);
        });
        this.breadCrumbs.addEventListener(breadCrumbs_1.BreadCrumbs.EVENT_PATH_CHANGE, (event) => {
            this.path = this.breadCrumbs.path;
        });
        this.oncontextmenu = (event) => {
            // allow for adding ContextMenu elements as children. These will function as context menus.
            let dialogs = this.flatChildren(contextMenu_1.ContextMenu);
            if (dialogs.length > 0) {
                event.preventDefault();
                event.stopPropagation();
                for (let dialog of dialogs) {
                    dialog.position = { x: event.pageX - window.pageXOffset, y: event.pageY - window.pageYOffset };
                    dialog.velocity = { x: 0, y: 0 };
                    dialog.visible = true;
                }
            }
        };
        // Set initial directory
        this.busy = Promise.resolve();
        this.setCurrentDirectory(new proxy_1.CachedProxyDirectory(new memory_1.MemoryDirectory(null, 'root')));
    }
    static get observedAttributes() {
        return [FileBrowser.selectMultipleAttribute, FileBrowser.showHiddenAttribute];
    }
    get rootDirectory() {
        return this.cachedCurrentDirectory.root;
    }
    set rootDirectory(value) {
        this.setCurrentDirectory(new proxy_1.CachedProxyDirectory(value));
    }
    get currentDirectory() {
        return this.cachedCurrentDirectory;
    }
    setCurrentDirectory(value) {
        this.cachedCurrentDirectory = value;
        this.cachedCurrentDirectory.addOnChangeListener(() => {
            this.logAndLoadWrapper(this.refreshFiles());
        });
        this.logAndLoadWrapper(this.refreshFiles());
        this.breadCrumbs.path = this.path;
    }
    get files() {
        let files = [];
        for (let row of this.table.flatChildren(FileTableRow)) {
            let file = row.file;
            if (file !== null) {
                files.push(file);
            }
        }
        return files;
    }
    get selectedFileRows() {
        return this.table.selectedRows.filter((row) => {
            return row instanceof FileTableRow;
        });
    }
    get selectedFiles() {
        let files = [];
        for (let row of this.selectedFileRows) {
            let file = row.file;
            if (file !== null) {
                files.push(file);
            }
        }
        return files;
    }
    get path() {
        return this.cachedCurrentDirectory.path.map((directory) => {
            return directory.name;
        });
    }
    set path(path) {
        this.logAndLoadWrapper(this.cachedCurrentDirectory.root.getFile(path.slice(1))
            .then((newDirectory) => {
            if (newDirectory instanceof proxy_1.CachedProxyDirectory) {
                this.setCurrentDirectory(newDirectory);
            }
            else {
                throw new base_1.FileNotFoundError("file must be a directory");
            }
        }));
    }
    get selectMultiple() {
        return this.getAttribute(FileBrowser.selectMultipleAttribute) !== null;
    }
    set selectMultiple(value) {
        if (value) {
            this.setAttribute(FileBrowser.selectMultipleAttribute, "");
        }
        else {
            this.removeAttribute(FileBrowser.selectMultipleAttribute);
        }
    }
    get showHidden() {
        return this.getAttribute(FileBrowser.showHiddenAttribute) !== null;
    }
    set showHidden(value) {
        if (value) {
            this.setAttribute(FileBrowser.showHiddenAttribute, "");
        }
        else {
            this.removeAttribute(FileBrowser.showHiddenAttribute);
        }
    }
    get css() {
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
        
        .${FileBrowser.actionsContainerClass} {
            width: 100%;
            overflow: auto;
        }
        
        .${FileBrowser.actionsContainerClass} .${FileBrowser.tableIconClass} {
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

        selectable-table {
          width: 100%;
        }

        selectable-table.dialog-item {
          /*If inside dialog, make smaller*/
          height: 300px;
        }
        
        .${FileBrowser.tableContainerClass} {
            position: relative;
            width: 100%;
        }
      
        .${FileBrowser.tableContainerClass} > div {
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
        
        .${FileBrowser.tableContainerClass}.${FileBrowser.activeAjaxClass} > div {
          background-image: url(data:image/gif;base64,R0lGODlhgACAAKUAACQmJJSSlMTGxFxeXOTi5ExKTKyurHx6fNTW1DQ2NOzu7Ly6vHRydISGhKSipMzOzFRWVCwuLGRmZOzq7LS2tNze3Dw+PPT29MTCxIyOjCwqLJyenMzKzGRiZOTm5ExOTLSytHx+fNza3Dw6PPTy9Ly+vHR2dIyKjKyqrNTS1FxaXPj4+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCQArACwAAAAAgACAAAAG/sCVcEgsGo/IpHLJbDqf0KhUeVEQRIiH6Cj4qA4Z1IM0LZvP08tE9BBgSu936rgA2O+AkSqDuaD/gGYKFQ9xcIdxD3R2Gox4ABoDARyBlZZGJCJuhpyIikZ1j42QjgAWGVuXqmYXBBwliLGdGJ9FdaOPoqQQGxOrv00kCLOyxXOgucm5GhohBMDQRcLE1LHHtqTK2pAaB6nRqyQpxdWztUShd43rpLjKDN/ggBci5PbU50O32+ql2ZANFMj748HNvYOc8glJ164hLnf9ICUAMbCMOIQYDV1D90+ZO3bLAEh4VvHJhHIZZSlcwdBhNpARRSUoUZIJvZQoEy6CyA9m/kdGDfzUPEKiEE6cKxn67IkHogYIJIcOmSDgaE5PO/kx5SkRg9SpV8OqXBRTq8efGih8FXLSasqN+v5xNRvSEaW1bcWGTUq3708AJ9aCdYsS7sKXfrcCaCCYSF7C5Pg2Taw1cEmBSR7rtWeY5V/KyixX9IAhnhHNkBOR9Qc6l+iBeU0XQb1ZY1bWre28Pu3LEomqcWQ7rh15de5ku2djwEAm0AWjb+BUUEI7I60KBCYINXIhBYoTHZgdB0x9OQYO29HUmyV8cFgBFXpLwRCgQOvkwxdg0N8+yoR7/a1QHScCiIDZHyk0kIBf+IG1nH5vyGcRcPZMl1k1AhCQXiAk/mwwglkNsrXfg8uVIEBzZYyDkoVI0IaBhtCQ4MCH2oQooHkQjlhCZ06QhtAbLB6hGQIbAjPBAVzZeBKE+umHiAdpvBJWgG1xcGBFKdiHh5I4jlhiHAIUyUQFmwV5GpFfkcDAKFwy2SUiGJjJBAmEBdjYCihowCWJTX55CBxXMqGiW3LeSQSVJHo5Sxw8HqEAccEZKsVJI+boJDWBJjEopHZKSsSjXXp5UKOfQhpLoZ4qF0eOOpaTqRHDpIYIiqka8SiccCyQEgJLkGAqJ1HVWsSthlj1hphDkCnrG7wKe0Ssv5aAqhBSyoqes0dcUC2kGAiQ2bKAYosEsZDBIeGh/uA2K+6zv74h3AUGmcoBresS8Vu0YZ4WbZz1JkHAshicu8J6qeXbb7bbulWCbAnXFuzBRSjL7V1DXIAvshDDayoctPrIbaf9ElzbG1AOIbLCr0LsHmTxQEcYxSoj0fBR50Q7bcwrSEyYV0LQ+avAOE+1bHP//YoxzhqnVvK/ppIatMsOC3FymUEroXNtzW5qbMlVCynrMVBblXLXPkP2ycxiHR20xanB3PXbcMct99x012333XjnrXe/aKekNtK/3hW2XvTGTW5tn2i9GdBve0zYMVMfdXPQV1vVLNM7r/S24keRVHRqf2fsZ20llw3p2Dgf7haKNtMduV5EDI6T/ttvc/DrOa/jhDrECiwbj+PEgVxv7mFxvQLbphrcddKmbth3TstNXi8B0dJOPEYmhu6str6fBvDDKmNuqsDMQ6a8yuUTd77JAKurMrSptff5r7vXqjpxjK/wfErXHsx99Vbb18Igdr2w3MxX4MKA8cQ1oKMUrgjw+9UDhdXAq3Tqfm4RnqEqiJD6rYBzetGgpDiIDydgcEpVI2ExPCgEEGJEhEOZoIiO4jRp1GldpEGU7qJQOZQESAEi0J4qLoCAQ9xMhaWRQvoOcsQ3WGkoCrAdInRYjvX1CIVJOBya5JEJclDRHvkT1AuVcL8MCTENBKAQe8rDmTP8holsJAYH/ipwRie0Qkrl+KIhToSG+cnih9AzUCCAGC+MNFEWCyzD6/SIkDmy8DQVkCLVLjRF54QNkEdBRAoq4AHUKcADFUhBu6QVx/4BwleGOOS+OgO8BCKKOZf4HCYF2BnxJRAOP0wkIHJIRgEy6git9CUMAxHGE0LGfUOwpS9xmSpjQoqVy1yjoZx5zCMo85aRagyosHkIZAohmNxM4lqoaSpvruCa0TTXV7aZTmZZs52IxAs8f2kED4RTFmHk4gPu6U4jUI+fJRiDoegBT3OiE1xBTFVB0mlOcLZLl3cqSjRrGU6BimuhCYQmNiFaqy6u0pq3FIEMnXWRX7ESXCkY6boUUxBBGgLzVwhQ6cGmUZuTjiymdiMBIfRi09lVQKZvI+RVDPoeQe5tNju9R0/xIYJ8HlUNhChkP4vwTwJpQTtHTYMVsMAB4XjgARxAgAiyU8es7i0IACH5BAkJACwALAAAAACAAIAAhSQmJJSSlMTGxFxeXOTi5ERCRLS2tHx6fDQ2NNTW1JyenOzu7GxqbExOTCwuLMzOzLy+vISGhJyanOzq7ExKTDw+PNze3KSmpPT29HRydCwqLJSWlMzKzGRiZOTm5ERGRLy6vISChDw6PNza3KSipPTy9GxubFRWVDQyNNTS1MTCxIyKjPj4+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAb+QJZwSCwaj8ikcslsOp/QqFSJWRBGicfoOOE8EiPCAjMtm89TzGT0EKgg73fq6IHH4QLthIzu+8sLFg93hHAPXHCJhSoPFgt/kJFGJSNui4qGiJeFAiMlkqBnGAQcEJibmUYTp6wqdw8En6GzTCUJqKhzRh64p29wCbK0w0O2vbl0x4m+wcS0JSmt0ouHqtPXvyopj86QGCPY4YzJ4q13I3zdZx5u5bjVRavKl5gCHupl0O7hukW8+4QCQkghDF+TCfPcwSMiD+A1ARMMMvnm8NjCIf8SzkMnEUmJQRWxXRTSUKO4BwU7spggIKRFTS4fRlRJ0qTGkStjHlNxj+b+Spvl+hHJqFManJk0ERalBhPozgQ+hyh1Kk0oRqrKtkSVirUVzpJLMWnFxw3J1LBWhRDtWmisOl5uVbFV9DVsIQsSp8aNN1cOub6J9hJ5wEFSiZZxBHNdWhfwG8VCHqBAQMAbyGx4k5zVyMgCgT1I1Fy57BIyCw4OAAA4kQ4NuEWmN2MTYAFplAkWStk0jVoDAN8r/IAlFPtYp7JoFozQaFoAAtWqfUNAc/haZrOoBBBo/WcU4mu8UUSHDgBBzzLRel3nskjF9mGjXEnjnfo3ed8ZzKw1B2G9XEUJcPfMLayENx550YGQhm7iFAcBB8ipswCDjykhGYIYAlBASk3+WGCSf/EESBMGBKpA33i+QZfibwFEUUJFpm3FAgEqQJXEhSveh6AGMRaRnkMgykgEh0SgpiOGOebnxAJY9SikEb3Zt6OUK2qQFhI/OuXkk5GJp2KGRwLAQBNMFhUkl0UYKeWUvlUZXY8l6kQkmkJwIF6KOa75JXkHLFFCX5XReYSaYOKpJ4q2GeFhUTYKakQI9uWZJ5jQSaAEhSFxIKCjLJTwAaWRHvplAZotFSGnQ6SgZ5ugZljYEa/F1CiqRhwQZqig+hbCERi0QxUHc9I6gQg5TtqqBiIIKJtNZ9IqxAV7GkupbyoYEatTAmzqrBAlFNDqtwAEl6ZOgW6LhAT+KIK7IwVFYNBVtuYmUYII6oJq236cbUkrpKKC65sBRFzrEASnxkuEqvVmqMGuQ5Bm06sGJ0HBgQn/dgIRXTUbMQsBSOsvCsXolOjGRe5ZMQCBDgeQtiRj4OXJ9ik4Y0xXkjxEBxQnrAEJQgj8oc1JBAAzeQxnCRBPQCMBgqEVazAmCw4DVHDSIwwN3QB1xsSyzSUwrTO7SYct9thkl2322WinrfbabD+JqUlbt4zVq1FrFKzNZTpVjdEmjRw2vu7o4vM+GpO8qFM2EuDSOGbzvU/KOsVtsLtY9fQiVlOTnHdIwmRc9uAaDTZ32RxgtRDo7mRu8AI6uQV4Qvqiivr+POex4G5M8Cbda1fcve2OK4U7S2NMEA8xezgQ5N6y78xZg5V7QCve1ci74y65oNVTpXzAOtVIcpxammVqxJtT5XfWXWkaLwbM71O8onPFHtXx82j851K1o7qsQ3ezAL5L/XvS/mDHhPKFRH5RGaA4VJeq1m1Mge9YUpNsBkFpMPBgB6TV3SpYiJp5BEa0gosSOKiICxbhcOUwjXKuFwoSJUJjJDSRFLIXDhi+AUIdmRBxRmgcFvpjI0oon4i6QYlWOAgV52uC49oSxEVox4dpIMB3YMPDqpyhOqiwoTQ4YAEoOmEUusHFEesRwCWoLDFNxIaJTEimSiREi4TIXxn+QDfGY3CRjarIDVDgCAcEhiZqKjSJIlJgAQ+obgEesEAKntefKqpAfX/40x34iJUrva40PFRBGaHQkECi5QjSs0sfgyhHP4gwCQas5F9EKcOOJJEFqZQVKFmpCD/SIpaq3IVjTmFLUOBSlkYI5S7RuBUmDRMCs7oKLXfok192JZlCEOYyj0ITY04TmjM6Zhx9EsOKWHKacXglER9wTVBqEwIoEdI3jolNaQKGI1xixy6xeUmnIE1QH3HMldypk3SiSp5LsaRjSolP+oljn2HxRMT0kUt/FIUgQFvA/xIiUJc0Q2zGsMk3bVKjTcarBILQyEbdwUWPas6N4WjnPI4t07Z4hHQaI92EHlpKBdy0oRAqPUUeRgAamkKhCldIAAcE4wHCgOEzXvSp2oIAACH5BAkJACoALAAAAACAAIAAhSQmJJSWlMzKzFxeXOTi5ERCRLS2tHx6fNTW1Ozu7DQ2NKSipGxqbExOTMTCxISGhCwuLNTS1GRmZOzq7ExKTLy+vNze3PT29KyqrIyOjCwqLJyanMzOzGRiZOTm5ERGRLy6vHx+fNza3PTy9Dw6PKSmpGxubFRWVMTGxIyKjPj4+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAb+QJVwSCwaj8ikcslsOp/QqFR5SRBECI7oOBFwECJC4jItm8/Ty0TEQTkq73fk6IHH4SjthIzu+8sJFhx3hHAcXHCJhQ4cFgl/kJFGIyJui4qGiJeFKCIjkqBnFwQCFZibmUYTp6wOdxwEn6GzTCMIqKhzRh64p29wCLK0w0O2vbl0x4m+wcS0IxGt0ouHqtPXvw4Rj86QFyLY4YzJ4q13InzdZx5u5bjVRavKl5goHupl0O7hukW8+4QCVoggDF+TCfPcwSMiD+A1FBMMMvnm8NjCIf8SzkMnEcmIQRWxXRTSUKM4DgU7qpiAIqRFTS4fRlRJ0qTGkStjHnNwj+b+Spvl+hHJqFManJk0ERalBhPoTgQ+hyh1Kk0oRqrKtkSVirUVzpJLMWnFxw3J1LBWhRDtWmisOl5uVbFV9DVsIQsSp8aNN1cOub6J9hJJgPTPiJZxBHNdWhfwG8VCEjhAkVIUyGx4k5zVyMgCgT1I1Fy57BKyCsmG0qEBt8j0ZmwoLBSGMsFCKZuuCZl+Ala3kteLOpVFk0CERteIFfU0c/haZrOoUBBQ/WdUclSuzVWGEq3Xcy6LHEwfNsqVNNOoC8FJ+2StuQrf5SpCQP3ZLVboe812cuG2uNwVCDCcOgn495gSkvUiQH1MWGBSfPHQR9MF9zmQnzgQLjFCRbv+bUWAA1AlkZ44Ay7RnUMZbkXEdoslxB4SI+Km4hQxllMiEic61eGMgzn1YhE1ApUij3y5dGMRFerEIpGRdRViEiP0RQCTIrLlwJIqOFjUk1QakSRVQ6pgYEgLdhnamEAJoNlSR5p52lxHshYTl256yRadQlzQDlUCYOmmnl2hUB9wAIVZpwoE6OTAfnI6JeihVKC5TwV7SarRlJAqoaVTDqhJxAWBMpjpEICGBIdq7nG2I6SNAvTGciq0alIFbY5aU0xukWaTp7YqYWk5C3VlaK+bVuRAMTrt12s8SpKkk6jL5rlnRT0lStWP0QqhK0CYyrrPsMsWa1OIOboKa7b+1lyrLVa1ZrshVdX8qgy06ILqEq/o5qvvvvz26++/AAcs8MAE/ytvOPS6C8DCDDfs8MMLN7CuS35GKwIAGmCsccYcb+xxxgMIUa5JyuprAMQoo2yCEN4mBG6vAXSc8swpCGGtsTjp28HMPC+8gLNYJdzrBQpk3LDRSC+ctNEgCPGukQY/bLTSVGvsMKYqCPtvAA4nnXLHChCxrUb47kvB1FN/7HHDIQ/RsjvtjsoBxGmj3PEDQ3W16qEPoH201XU3bMCnoe47AgldW90zxlgLcTAurrzsZgmL80yBEW8rU8Gj9VLwd+A818wsVuLli0HlM2twbBGlUsX5sgkgzrD+zKiTsF3m4oCYbQiKo+7wAWaxuWwEvdO+uOpJPB5OmaOO0IDvKReg6Vx7b/VA8b0vvoESUS51rpsoQAC67xqUPMSXFI+KggZLkw/8EkE6VP1W4UPvMLZDjAzQ/CrWb3zPHXBC/DaCLgGML3VlU4L+snIoLBkwezNjABSedpxDwcVX/7Pb/MQVDvRwRCUUSkSYHJDBh4kOCq0LR5iUIqCOFMg3ySshwwpQsb9g40JxkFA3KNEK0zzwgE0rwwLFgqDgjIcW1pmGD0soQeZchxUrRIUALCA0KYziNrhYYvYU0Lgp9EYROJyGheImwEq4TAkkrFsQV9PD35DNEWWojQD+hIRG9jHshGi4wLbCqLk4RMACHqhVAjxggQiQDj51zNgJauiEKN0hikthT6p0skQS8G8JDeFjTNhzM8f4cHWSuGCV7CJJx4BRJeZ7k10qgCdErRKGPBqgS0r5ylPOSJZUaWUna2khFSWolq2cpCejgss5HWGXpoxDKofxy2Sy8pjOJMT38EGovkiSl4pYpjM+gk1dRrMCKJnRN5ypS2x+kEfsMGUwk8kTM33EMZx8ZTjrlM5I2pAt0+wSD9kST+oxkkf6wMo1u0KQfCUAfS66J0CawS9j2GSgrmLov0YgCI1AdB5T/Ge2ijMtVHhTHMIpGBcqOo2LekUE2hSpGgQj0dFnGuFDp8gDSqso0iNU4QoIEIBgPMABAYDhMzStqVCFEAQAIfkECQkALQAsAAAAAIAAgACFJCYklJaUzMrMXF5c5OLkREJEtLK0fHp8NDI01NbU7O7svL68hIaEpKakdHJ0VFZULC4s1NLUZGZk7OrsTEpMvLq8hIKEPDo83N7c9Pb0xMbEjI6MrK6sLCosnJ6czM7MZGJk5ObktLa0fH58NDY03Nrc9PL0xMLEjIqMrKqsdHZ0XFpcTE5M+Pj4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv7AlnBILBqPyKRyyWw6n9CoVJlREEqJT+k4EXwSJYIiMy2bz9PMpPTRnBbvd+QYgsfhGu2EjO77ywoYH3eEcB9ccImFJx8YCn+QkUYmJW6LioaIl4UaJSaSoGcZBAILmJuZRhOnrCd3HwSfobNMJgmoqHNGIbinb3AJsrTDQ7a9uXTHib7BxLQmEa3Si4eq09e/JxGPzpAZJdjhjMnirXclfN1nIW7luNVFq8qXmBoh6mXQ7uG6Rbz7hAIuiCAMX5MJ89zBIyIP4DUNEwwy+ebw2MIh/xLOQycRiYlBFbFdFNJQo7gPBTu2mKAhpEVNLh9GVEnSpMaRK2MeO3GP5v5Km+X6EcmoUxqcmTQRFqUGE+jOBD6HKHUqTShGqsq2RJWKtRXOkksxacXHDcnUsFaFEO1aaKw6Xm5VsVX0NWwhDBKnxo03Vw65von2ElGA9I+JlnEEc11aF/AbxUIUnNCQUhTIbHiTnNXICAOBPUjUXLnsEnILyYbSoQG3yPRmbBowFIYyAUMpm64JmX4CVreS14s6lUWjoIRG14gV9TRz+Fpms6g0EFD9Z1RyVK7NVYYSrddzLotOTB82ypU006gLwUn7ZK25Bd/lKkpA/dktVuh7zXaS4ba43AsIMJw6Cvj3mBKS9SJAfUxgYFJ88dBHUwb3nZCfOBAuYUJFu/5tRcAJUCWRnjgDLtGdQxluRcR2iyXEHhIj4qbiFDGWUyISJzrV4YyDOfViETUClSKPfLl0YxEV6sQikZF1FWISJvRFAJMisnXCki04WNSTVBqRJFVDtmBgSAt2GdqYQAmg2VJHmnnaXEeyFhOXbnrJFp1CZNAOVQJg6aaeXWlQH3AAhVlnCwTodMJ+cjol6KFUoLnPAntJqtGUkCqhpVMnqElEBoEymOkQgIYEh2rucbYjpI0C9MZyLbRq0gJtjlpTTG6RZpOntiphaTkLdWVor5tWdEIxOu3XazxKkqSTqMvmuWdFPSVK1Y/RCqErQJjKus+wyxZrU4g5ugprtv7WXKstVrVmuyFV1fyqDLToguoSr+jmq+++/Pbr778AByzwwAT/K2849GZrr1OebquRn9EGqZAQ5ZqkrL6puqOLtwmBSyxWIVprLE76VrwPpr0BlHCvoGLV07tG/itxQsII+y/H7hDhsDv47isAVgvhPE+7oyqgk1sZJ7TqoUKLA+vCIT2qb6lUUXcwLq547OaHMfUca0wLSK3w1djslTJnmGYrMlX7UR31yl26DZTYRDT9VLZfcmgWm8vOvM/FYhZV5qj9Ca7pXEtvZTeGSkS51LluEmqSn3k7BfGMkpfTod9K95r5MUS3YPJx0X4+DclGcF42uqZfEjrFISXeUf6YrWOC7SR618kBBBv8ptHrQ4gbDnocqWTCAQAk37tmG0kht3O+Bwg8JBFQkHwHykePC93tNV/lfHD7McEIyZePPQDLQ3cN4EyMLhaCwY1HSwYpXADA+effj772rNyu4XWsoB0qBICB8EHBBB4oQPn0t8DrpQ88rKAMGs4GhwthrQTTU0IEUEAC8zXwgx14oHwIAbkpcAxA8yBgBofwgQCw4HoM/CAIRVikxFRnWxYshyIigIEQ1CoCBgiABBCgv/zJEIYxDKH2BueHKN1BgEthDweOSEUkxtB8NGSIKy5Hm8DADy1H4AD+qmhFIxrxflmUCvvMAJcv9kWKZCyjB/7HmD8ldoR9qjMJnlqQgisysI4ejCMamZRHgMCxgWYMpB9heMY0dqSQegxjIpOoSDLW0ZFkMY9jFrDHPh4RkIL8JCadAUmHdBKQkwwlIs3nNQJp0i6J6KQMz6hKECbPAD6pnY8kychaChIBx4rKR2B5B1n6spYPkN0svrHJN+xRjHM85hFRwMW3TGsuxpRmFRFQATN9xDFSpKM2FwiCtJmJHW8M4zhliABcZooSUVSnFaXZAQuskUr6wMoh51lLByiTRwqoXFDkSUtBdsCf/TKGTfa5SCp24ADmTKggNHLIgh6RAh64p76Kc01pnLKSH7wACv6Zr9rsLA4MneUKUCoQzIItQQ2C6OhHY3iBlV7JpWWowhUSIADBVIAFLHAAChogAI3i9KhDCAIAIfkECQkAKwAsAAAAAIAAgACFJCYklJKUXF5cxMbE5OLkREJEfH58tLK01NbUNDI07O7sVFJUpKakdHJ0jIqMzM7MLC4snJ6cZGZk7OrsTEpMhIaExMLE3N7cPDo89Pb0XFpcLCoslJaUZGJkzMrM5ObkhIKEvLq83NrcNDY09PL0VFZUrKqsdHZ0jI6M1NLUTE5M+Pj4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABv7AlXBILBqPyKRyyWw6n9CoVJlREESIh+g48TwQIoIiMy2bz9PMRPQYWEKWt+Vx/MjvA+2EjO77ywoXD3FwcHdzXHF3hYoPFwp/kZJGJCJuh4qKcHRGdoaYjBYDIiSTpmcZBB6MhqxyIXl1mm8DhZehHhd8p7xLJAiYs7SwxIidr7XJocIWCKW90ES/hG6uw8rJnEV218TKIbaHztG9JCmhrdje67HH3eoDyq9yKZDkkRkimZns/djaRLj5G5hsH4Jd98x8qDUPHDyCsAAOEfiwYqFQAz4kLGPu0zuI8CQKoQgSopwHzzY6mcDvo0V4xrZRK/ky0wSVTPLNc0mzmP7IFSRfmgx1ECcSEg889hTaTiZPpuzuoDRaZMIlZEsh/gya1aKim1SFsEzXlWDMgDOhQr2jMewKq7bKWtyaVq5Je2GtPpV7dmJdtTSbuZ1YDbDQviP/2lUneDDhvYZD0IVs9wJOvHUKL/Y2eXNFyyrtbEmykDJTxEAVR1YHeuNYC60zmzbZeTVBBEoUgI1E4mqI2J00265V2zMx4EUUiErZJ0PSQ6ORlJbr6MMYJFU+CBJeFjkR5W8eIDyjT9hvJdOhOsIMJVC87rmpNUYzAR0tC9Flg3z0RwEC7hZ5N4RyrcTRlhm9aSLPGwKOBCAsA+hiSgYXPIhNgysQuKAFzP5JkQJWG+YX3DsS9pJBev1gqOE6cfzkBDc8yYEhiiWSkwEwKcY3kIFprAIZg+i5MQB79yiQlDIq7iXKeE1c8IlJcYi4TVFU3UhLkiXBFgUJCg4VpWNLLIRbEivWZAGRSpyj2o4YgonmgGvKs8kT4MW1Fn5gTlGnWnG8aYSasy0oZZ7xBQoOakaAZ6ighDahaFd9MoHjosVE2iiZhFA631Fd2hbCgZcmmuliHRbhZJwgbRpqEcCgKhSGHoDY1QBMripEBhYuNUASLLkKkZ+27smXBaASMeliY9qaBI7DwZEsEbj6WhGtyuaW62nUVrWIbcVWa0SFlDIUApHlLZatt/7YXZvqs0LEGi4sbaILrl2iFJGBnbPWii606gqFEIyV7SuptFERS4Q++PIJrMAZvussEYO86yLDRLy3mhsAEQxPvAxf4PCuQnD5bkYUL1EmpPZwZZi+Jd/a745tEZBwYBO3LETEfIHWasA2J+ExvWN+GK7BPUun8TpjDkLvwi2fbBgn7trFcs8ZHF0QyEVnrfXWXHft9ddghy322GQzHGuBi2Sa9htT21w12nCr3QonEQ/T5d3UMF2yyHbPhPdJQgDa0uDMdKv1Bx6pzYzinCD8RlyPVxP5KxxT/HND4toN+ZgeK8kiLIgWXbdcoI1lWxxtUxztzIe1Jexqu22tAP5Zhp05hNXeVL5v54tB/G69XUdtG0AID2e77LLy+azKPanac7mng3pvs/Gk7i2urNPE3i2rvUGA1gR0mpVIxZcVx7ktr94scszfqXuoAA/XbbTNLum2uMOhPwSzQNvc6sjsGkKvFmMphhEIdwwxnBCEE5nwWC9PGfDRyLB2BN7BAzABVFZ5RnaeJHCJJjVRYKheM7JSsepiLDoeupy2FOeJamRAYhiKIqM3pa2vZTPsSQaP8LqsvK9RCymL3m42nB9eRkcYbI/VdkgoO8zoZfEY4hAsSBMMDQAEJryHleDwRMoYUX1MYeIKHgABAFCgZrxQgLsI0UWtPNAp7NiYEv7ICIA6bsAAUkRDJTDXQelcS4RMsOFt5ljGDdQRABsYgQnemAYCMEQ+ihjUY/whRiYkiCBWLKMdD1nHAkQgi6hwZEsuIqMgvWNIaPDEQ6w4gk1u0pB1HEEFUtAfS1jDGwXpo36UkUeffQRDdOQkLA9pSFiqgANoJNMFzraPGH2JNJoxInYEWQtgarKYnMymKwGQAAlw4AA1U4B2hKaU5H1OS9B0YCQUwD1ravOd2hzmIRtwhPDdcluB0WVw9NcHgWTylYgUJjwBCgB6GiF8zZxFViKZG0AqBJ1ICOZAASpPbRq0CPZsCL0MIcloADKY2JRnRYkJz4sSAaHGYYw0e/4h0YmGNKABrahJhyAzBJpFn27xQAJiylOSTpSgMxWCPanXj/t0dCM6/SlMselTkRa0njatCRcHk1SejlSpAq1jUFdQ05TuqJeReMBOf/pSrM4Tqhz0CtGoUtWrwtSs2dzAVmUGRUg5lBwXKAE8h8lUuD71oOYk6gPAeooMOMCp2/TrWQGb1hQxkhwhSABi36rYudLOMyRbFQE6sE23mnWuUWXHYL11gLF6Fq6WDW0y7pqnCYDgtKhFq2dg81jHiKABlFXsXzF6WcMggLB5SkEDNgDbvYIWWcC9FAEMUNx3pnZRVPIaASKwgOYuFqMac0RtKZYCB2CguHKtZ2/jyDefshXBAgHQAHEHCtqnVMe8vrCAAzSAAYuKNy15eMR2zUsCD5jAAQ2ggAO44AUEXMA6+4Wv2IIAACH5BAkJACoALAAAAACAAIAAhSQmJJSWlMzKzFxeXOTi5ERCRLSytHx6fDQ2NNTW1Ozu7Ly+vISGhExOTKSipCwuLNTS1GxqbOzq7ExKTLy6vISChDw+PNze3PT29MTGxIyOjCwqLJyanMzOzGRiZOTm5ERGRLS2tHx+fDw6PNza3PTy9MTCxIyKjFRWVKyqrPj4+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAb+QJVwSCwaj8ikcslsOp/QqFSJURBIiQ7pKBF0EiSCAjMtm89TjITUyZgW7zfk+IHH4RmthIzu+8sKFx13hHAdXHCJhSYdFwp/kJFGJSRui4qGiJeFGSQlkqBnGAQCC5ibmUYSp6wmdx0En6GzTCUJqKhzRh+4p29wCbK0w0O2vbl0x4m+wcS0JRCt0ouHqtPXvyYQj86QGCTY4YzJ4q13JHzdZx9u5bjVRavKl5gZH+pl0O7hukW8+4QCLoAgDF8TCfPcwSMiD+C1DBIMMvnm8NjCIf8SzkMnEUmJQRWxXRTSUKO4DgU7qpCQIaRFTS4fRlRJ0qTGkStjHjNxj+b+Spvl+hHJqFManJk0ERalBhPozgQ+hyh1Kk0oRqrKtkSVirUVzpJLMWnFxw3J1LBWhRDtWmisOl5uVbFV9DVsoQsSp8aNN1cOub6J9hJRgPRPiZZxBHNdWhfwG8VCFJjIkFIUyGx4k5zVyOgCgT1I1Fy57BKyCsmG0qEBt8j0ZmwZLhSGIuFCKZuuCZl+Ala3kteLOpVFo4CERteIFfU0c/haZrOoMhBQ/WdUclSuzVWGEq3Xcy6LTEwfNsqVNNOoC8FJ+2StuQXf5SpKQP3ZLVboe812guG2uNwLCDCcOgr495gSkvUiQH1MXGBSfPHQRxMG95mQnzgQLlFCRbv+bUWACVAlkZ44Ay7RnUMZbkXEdoslxB4SI+Km4hQxllMiEic61eGMgzn1YhE1ApUij3y5dGMRFerEIpGRdRViEiX0RQCTIrJlwpIqOFjUk1QakSRVQ6pgYEgLdhnamEAJoNlSR5p52lxHshYTl256yRadQmDQDlUCYOmmnl1lUB9wAIVZpwoE6GTCfnI6JeihVKC5zwJ7SarRlJAqoaVTJqhJBAaBMpjpEICGBIdq7nG2I6SNAvTGciq0atICbY5aU0xukWaTp7YqYWk5C3VlaK+bVmRCMTrt12s8SpKkk6jL5rlnRT0lStWP0QqhK0CYyrrPsMsWa1OIOboKa7b+1lyrLVa1ZrshVdX8qgy06ILqEq/o5qvvvvz26++/AAcs8MAE/zsBAAgnrPDCDAOwgZ/R2uuUpwM4bPEGF2eM8cYJr2prkAoJEUHDJC+8MQUBp+qOLgxgXPLLCAcQsHEuhegAzDh7EHC5JmFKgcUIuyx00EQrjAC9y0oc0kwXMDw00EO7DAC++ybokjAIJCw1zkDL7C/NnBJRsdYalz30BP8KgNVCJxTNNdAIY2sroQm59TPZTz+tMMYV9OutRrBKsPXbC48A8aGgdkXdwXAT7rID+34YE9UqtO024Qgbnm9/Ou2VAeZOY5xCvtbGtB8GIzQOOgAjtGvmYaEeUcH+5ZhjfEC2f7sDIhICrN7wBnJTSfc+ygpRAO1vuzzB4TNy3hXlRHCAPOh9j5q7RmEK7rvWLhsw6vDzXLnEAdPXjimk4IeDp5flc43xCb2mj4vrKoy8fcLVx2+eScELAcH9CINftuTHCvqJTHVvE6CbsETAO/RvCCQYXAIP9SEAzYN5Q2ibBF+mQC5wRCUYgIAJKGCh32xECiU43gYb1kG5dMqAkSiQK8yTvWM8Sgp341oL+TLCx2AQDRTpIQnhYEFpFK8JI1thwnbIEFeQMA7SQRoQCXCdUxSxEA9EAgGyxkETOnF/eBiPJKxzjCsmgjJo+NkKmciVHvbQFySA4RL+ijMt75jwFEeEguUYxsaaCBGMd0iEABxRhtqoDUV3TIxhUDC4Pv7kj+GDwAU+UCsFfOACInTJG2oIhzL9YYsKcyRC3PjFcGCCPSrDSm7EFwkTuEyUbiThEx2yvtI5xjXn+oMBNpA/8MzwiW/k31/sQkSVQK+NfxwiUGpJTN8QaZSynCFWUOkYK/IoQV8MZkiYWU1nRsVq0ozDNIfZzWL6JEYUgIMyXYLKZrYij8MApztrWU5C5BIfDaxIO+t5lK18xJ1voCdAF4CS5oGNmNx05wd5xI5qri+Vmrynij7iGPbYkjE/7Agv+kLNsNhjVJRYikXD4oll6WOcuygKQfJYpYAv7aOjTmkGv4xhk5HaBEQZhVQJbKORfbpjkDntVXEAWRVyTkM4BeOCIHBh02noIakTWYMA6jgQo05GD1KE6hFKIIErQEAAgvmAAAQAhs9kVatoVUEQAAAh+QQJCQAuACwAAAAAgACAAIUkJiSUkpRcXlzExsTk4uREQkR8eny0trQ0NjTU1tSkoqRsbmzs7uxMTkyEhoQsLizMzsy8vrycmpxsamzs6uxMSkw8Pjzc3tysqqx0dnT09vSMjowsKiyUlpRkYmTMyszk5uRERkSEgoS8urw8Ojzc2tykpqR0cnT08vRUVlSMiow0MjTU0tTEwsT4+PgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCXcEgsGo/IpHLJbDqf0KhUqWEQSglI6Uj5QBIlAkMzLZvPUw2lBBm0Iu836wiCx+EDLYWM7vvLDBcQd4RwEFxwiYUtEBcMf5CRRiglbouKhoiXhQMlKJKgZxoEHxGYm5lGFKesLXcQBJ+hs0woCaioc0YguKdvcAmytMNDtr25dMeJvsHEtCgsrdKLh6rT178tLI/OkBol2OGMyeKtdyV83WcgbuW41UWrypeYAyDqZdDu4bpFvPuEAkZgIQxfEwrz3MEjIg/gtQEUDDL55vDYwiH/Es5DJxEJikEVsV0U0lCjOAgFO7qgMCCkRU0uH0ZUSdKkxpErYx5rcY/m/kqb5foRyahTGpyZNBEWpQYT6M4EPocodSpNKEaqyrZElYq1Fc6SSzFpxYeTa1g55LpeGqvuAIcNSqYu/XoW0wWJAzgAABAgrtpEVoUQ/fuGrREGSP8QQKB3b98kcrHSJZzIcBEGLQakFJWicePHSCK7Y3SBwB4kaq6AxGqZCGZD6dCo2EsbgF64kDUOuJAYCoULpWy2NhtneJQItmvTfusXWydufRiU0Gh8ZUtCPc2AQKBcOfPc0gYQiP1n1PVr1cHGabEZyonky73jDr2oxfhho1xJq/66EJzAT4zQXXzLzccFIQmQ98wtrPDXS29OoFCAd/BV+B19EXwAHT4M/gRXmRKY9fKBgkx0sFdjFMoXV4I0acBgCw6KcxcUJaAYH4o22mbgVkcQAGNz82zIxAInDgifXjaCxuMRQsZznjIAIsFChUXmOOCFSz4hmjJNIjGBkUV2l6OSWS6xpThRFpFAmMlZKWaBZTJxZpBMGOAmlUbiSECckLXjFFRKgPDAm2CCiQGfGGLFnhISUOlZod6dgCgS0xU1IxIh5AmpcgW0NykKHlL1QRIfWIjnphykOemc+3Tpgghg3jmgAZMuwYJ+VLWmgQUUyjogCRDWSgQKuIY0gIJ51eYrmAoIu4SPLrkC4WyEbroXCZ46KwSoMUVgWQM3Wqtss9oqMR1W/qMydOqytQFbLhXFAhWbgMqKW5sI7y5RKVXZuTCbjewqp2q+rO7ElgD12rtXBfky8QFVESy0QrWoktmwEedW5MoQBJiqMADpXkzfCEDBIQtyKYq7QrYiaxDvaBHMpEDCCnsg8hIPU7WnCw7kGPCJFt9MxL4VafUlgQqPIDR4TukiAMAKc1DdzQWLJEQFSNvLAcs3E+tSyEuHLfbYZJdt9tlop6322my/G6pDJIbt8tdCrFYR1yL3V1E10VAVbNiDAaQLOFRdWvYFWAFKQLRlLd13SDurB1DcN7uMVU8o6OTqzXoDJUxXhotNuEtE2G0T2GI/7NJCozu1ecMM6MRW/uAmTf1u6xX1OzdVx4qtgZ8hkfe2Rq6ELjK0omLcbe9CazA8QJZJTvzONy/eFYS/d8X8xdnHtP3QOrUA6MUvujSc9AC9jmjnIf3twvMmjZiv80WhXgTiRdmeJe5OGT8sYf0SVtWUwbXyYQVvSxogepjAPqDoL0sK3IT6hPA4pzywTBE8ReMuwxqhZfAOExxCBfdxQZWw7IMDgULmhOMsXqRHIyEkAv4Swh+OqMRFifAfcbBRQiF0Txk6rEmGYhiJDhHihc6hXKA2AiIEKTESlGgFElHhPiaMcC1NPIV4nogG80xjiqwY2BJQ8CRWBPEn0vjABbgohVEEBxdgvINm/tCAvh8loYG+KAERlyAd4PXijFsKYBn4B4c4YkONe2QIcIACyCOWx3TeymJCFMGCC4DgdQwAwQVuFa0INBIO8vsDse7wSbUAiHay88uiItGQGP0FQNarix2RkMlQuFCSSzklZRzZkSrikSrjI0Isd1nIOP3SJbqUpSJ6SItjArNHyuRlVEKkzGBeJZrLnCYx72BNIQwTmy2o4jCouc0IdNMFyAOnIPGBQo2cEpxH2cpHsHnOdBITJUv6RjnriU0bZokdxDwnKhW1Th59ZJewlCU+hQXQXKZlKQXlUxRNCc2/eOJi+sDKO7tCkKUxwID7SOafEKgtY9hkowARH0nzQoUCQbiTDgBR40o5Vwll1HMez2mbKlw6DZRuQg86XYIaBOFHc/ZoEXkowWmCGoUqXCEBH2gNCCDwATCYho1MZWoQAAAh+QQJCQAoACwAAAAAgACAAIUkJiSUkpTExsRcXlzk4uR8enxMSkysrqzU1tQ0NjTs7uyEhoSkoqTMzsx0cnS8vrwsLixkZmTs6uyEgoRUVlTc3tw8Pjz09vSMjowsKiycnpzMysxkYmTk5uR8fny0srTc2tw8Ojz08vSMioysqqzU0tTEwsRcWlz4+PgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG/kCUcEgsGo/IpHLJbDqf0KhUKWqQMAXK5CjZNBAgguIyLZvP04sJc0oA3nDOsWN61O+CBkhCRvv/ZRsBAxlwhYcAGXJGdHaOd44NFQqAlZZGIBgWb4WJcJ8Ai0WNkKUmeCAil6tnEhoUnJ+dnZ+iRBKPuXW6Dw0EqqzBTAQeELGetKBxXLylvHYIwMLTQxUFs8rZx7ZDuM7fj6XR1MIgDobaysmhzODuvCXS5H8KC+vpx8hv3ELezf/fTCDoM+/MhxDo1mHDJoudEX/vIj4S0KFgGQIR0GW7l7BWO4Agv8WzCOVBAkTaFupr6LAIxJAwHzwQIIEkkwsjPKXjiC8R/j8UBCQKDXcHBEGbRQhQ4JkPEVOPD2EO3QWpgTykKAS42amxJyhFR4JKHWuqJlYhGyDco5UMpVewUaeSzVXxbFa1Xdl61fYzqNy/dupQsivAGEudT1P+fAlYoh0QdodsyMAw8d6+jedCjiyZo+Wdi+cCrmBzMJLJK/fiwyx67GaLdF4fQa36bejMEmXPk1BUCerPXjHjBqi7iAKzlUQIeFScyO/aij8Od9Z8iAITAq6eudAAkh3SSZ5D9xmAxAbtQi5IIACixPTHSnjbaXD0DIhm1dG67WkgwIYyEoCwQWsm5IeCBMv15gdjzPm2nzIJTFACIAGe4lp839RlhnIg/oGHhAmUaROCBshVcgEBAghlIIK52JHdGSXA5OERIK6TAAPoJYfiOyu+M2EZpABUx4xG1MhJASVOI8J936yY4D9JOnHBgFMZOFkGBvxnUxel9BiSAPU1UcFoSphQQI7kiOAefEkwCA6RTIhAoIGcASWQEteRZVoTMWYGZ51EoHkgYD82kSdudAJ6xKFz7alEnwSyqaihuBWK53tDTsqEfLg5egQCmNoh6KSMZobAEiKEagIBmiZRKoEmCDpmpJCc2ioSoNLqyJ+S6VrHBmHemh6VumopHa2eCmtdqMmiwKSutiqLK6bREnFBisWOKuy174H5EKa8SjsEAb6aEOWz/rh5K24SU+r6QHHE4sbqukrMipsJxqbXbbD0DsFtpHYcFWRjBfa7BLqi1aGhs+42a3A/78nWHa35Pjybrg0Q8V64FqNgL6xDyDldlB134yswbpLFb8n/4lYXucNZWrIRE8srBMJkzozEx43ZCinBC+t8i64/1kygwzOLHGnGKMTb2sozq0Gx0FRXbfXVWGet9dZcd+3115M6DRjULE+npdGNaWvxq38x/XNrJAs9sGg/4jwXxyXzLJqtMMPKNNZvAzZvylOR/bAa09WldKdYsz2XNBtjbfdfRKAtWsVCbzDd3wxPh7TBCvgq29yAJUrv5GQtLPVw6urccqT1iU3W/il4ryvWcJijPtRMhivb7nTFES7Vqjr3PVyUr2fW+uHYsh6s7sNXa3CuwCMh/FSft+o4YHE37esDwBr8e7H1hmo6oNBPxXGq35sQtLKc6joq9Sf3G39miW6v2cP3i5Y9CoETzfkm1b+pcO5StBqgpgoIk/8JIYBDUSBSBMVAH0FhcWSRoE1igyE9RUFvucGTUc5yAQTsqoMqkkLyOtTBDTjQEgrQXIPaJJTlPYF0+EHgHQZSkCXlkIYg6R4TIJgLA7FNAATonRlO9KQmoRAeZ+DQOzhWQfBVQIlQOBGVIuIlZ7yoFcTRoZBA8MIlKAAEzZPRE+/wvilMrotS2cAk/gBUARnmzHpdAgR3qCPG3d2hBBXoANIU0IEKrOleD6DiHcIHiFRBQpHtk5kQcFg9GsbqEv4woqoeIEmgtE8XRmyjHzjoqk2aoJOUFB1WhKg/U4Xlk04klSntgMpZ5hFQrYyU9IRgPFjOMDLXseUDdomCVKpKgzAUZh2I2UtlCnEawfRlrcKizEeIcjfVPOUcpKmLZ6apAdxcJjXD2Qu1keMCIBAmM8k5wkl1II2hIqYxYXXNyFTBlJ1spq+sIq53qqqWsKznpHyIqXx+MhUWU5OvUPm9kcxMAfQj1BymM46qiQBUjWEowSqKNRFUwHIR0ShZ5GjOh6JxKMycigDIMQg2l3w0pNuMiB68+TX1fBSewxxnKfKwByy21F8KYA8CNtCcDjRgA2AgAB9+ylQmBAEAOw==);
          display: block;
        }
        
        selectable-table.${table_1.Table.dragOverClass} + div {          
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAhVJREFUeJzt3bEKhDAQQEH1//9Zy2vkqYgXkZk6xcLmkTLTBAAAAAAAAAD8zKMH+IB19AAH7PiGZfQA8GYCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCPOFs+tjU8D/nbr7XhAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAgCgSAQCAKBIBAIAoEgEAhX/kln39v/j7fjG7wgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAQBAJBIBAEAkEgEAQCQSAAAAAAAAAAAJy0AdBdBGYni5DTAAAAAElFTkSuQmCC);
          display: block;
          pointer-events: none; /*prevent interfering with drag&drop*/
        }
        
        selectable-table .${FileTableRow.hoverImageClass} {
          position: absolute;
          top: calc(2 * var(--table-row-height));
          max-height: calc(100% - 3 * var(--table-row-height));
          z-index: 99999;
          background-color: white;
          border: 1px solid black;
          box-shadow: var(--browser-shadow);
        }
        
        search-bar {
            float: right;
        }
        
        .${FileBrowser.menuContainerClass} {
            float: left;
        }
    `;
    }
    updateAttributes(attributes) {
        this.table.selectMultiple = this.selectMultiple; // Sync table attribute
        this.table.showHidden = this.showHidden; // Sync table attribute
    }
    render(shadowRoot) {
        super.render(shadowRoot);
        shadowRoot.appendChild(this.breadCrumbs);
        shadowRoot.appendChild(this.actionsContainer);
        shadowRoot.appendChild(this.tableContainer);
        let slot = document.createElement('slot');
        shadowRoot.appendChild(slot);
    }
    // Wrapper utilities
    loadingWrapper(promise) {
        return __awaiter(this, void 0, void 0, function* () {
            // Add loading class to element while waiting on the async call.
            this.activePromises.add(promise);
            this.tableContainer.classList.add(FileBrowser.activeAjaxClass);
            try {
                return yield promise;
            }
            finally {
                this.activePromises.delete(promise);
                if (this.activePromises.size === 0) {
                    this.tableContainer.classList.remove(FileBrowser.activeAjaxClass);
                }
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
    // Actions
    copyUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield fetch(url);
            let blob = yield response.blob();
            let buffer = yield utils_1.fileToArrayBuffer(blob);
            return this.currentDirectory.addFile(buffer, name, blob.type);
        });
    }
    moveFiles(files) {
        if (files.length > this.maxNumMove) {
            throw new Error(`cannot move more than ${this.maxNumMove} items.`);
        }
        let moveConfirmDialog = document.createElement('confirm-dialog');
        moveConfirmDialog.name = "Confirm Move";
        moveConfirmDialog.onClose = () => {
            moveConfirmDialog.remove();
        };
        let confirmText = document.createElement('div');
        let fileNames = files.map((file) => {
            return file.name;
        });
        confirmText.innerText = `Are you sure you want to move ${fileNames.join(', ')} to ${this.currentDirectory.name}?`;
        moveConfirmDialog.addEventListener(dialog_1.ConfirmDialog.EVENT_CONFIRMED, () => {
            // Make sure object isn't already in this directory, and if not move it here.
            let movePromises = [];
            for (let file of files) {
                movePromises.push(file.move(this.currentDirectory));
            }
            this.logAndLoadWrapper(Promise.all(movePromises).then(() => { return this.refreshFiles(); }));
        });
        moveConfirmDialog.appendChild(confirmText);
        document.body.appendChild(moveConfirmDialog);
        moveConfirmDialog.visible = true;
        moveConfirmDialog.center();
    }
    copyFiles(files) {
        if (files.length > this.maxNumCopy) {
            throw new Error(`cannot move more than ${this.maxNumCopy} items.`);
        }
        let copyConfirmDialog = document.createElement('confirm-dialog');
        copyConfirmDialog.name = "Confirm Copy";
        copyConfirmDialog.onClose = () => {
            copyConfirmDialog.remove();
        };
        let confirmText = document.createElement('div');
        let fileNames = files.map((file) => {
            return file.name;
        });
        confirmText.innerText = `Are you sure you want to copy ${fileNames.join(', ')} to ${this.currentDirectory.name}?`;
        copyConfirmDialog.addEventListener(dialog_1.ConfirmDialog.EVENT_CONFIRMED, () => {
            // Make sure object isn't already in this directory, and if not move it here.
            let movePromises = [];
            for (let file of files) {
                movePromises.push(file.copy(this.currentDirectory));
            }
            this.logAndLoadWrapper(Promise.all(movePromises).then(() => { return this.refreshFiles(); }));
        });
        copyConfirmDialog.appendChild(confirmText);
        document.body.appendChild(copyConfirmDialog);
        copyConfirmDialog.visible = true;
        copyConfirmDialog.center();
    }
    handleDataTransfer(dataTransfer) {
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
                        let name = 'unknown';
                        if (splitUri.length > 0 && splitUri[splitUri.length - 1].length < 255) {
                            name = splitUri[splitUri.length - 1];
                        }
                        promises.push(this.copyUrl(uri));
                    }
                }
            }
        }
        this.logAndLoadWrapper(Promise.all(promises).then(() => { }));
        let pathsJson = dataTransfer.getData(FileBrowser.dataTransferType);
        if (pathsJson) {
            let dataTransfer = JSON.parse(pathsJson);
            if (!isFileTransfer(dataTransfer)) {
                console.log(pathsJson);
                this.addMessage('invalid data', true);
                return;
            }
            let getFiles = (paths) => {
                let filePromises = [];
                for (let path of paths) {
                    if (path.length > 0 && path[0] === this.rootDirectory.name) {
                        // make sure path relative to root directory
                        filePromises.push(this.rootDirectory.getFile(path.slice(1)));
                    }
                    else {
                        throw new Error(`invalid path`);
                    }
                }
                return filePromises;
            };
            if (dataTransfer.move.length > 0) {
                this.logAndLoadWrapper(Promise.all(getFiles(dataTransfer.move))
                    .then((files) => {
                    this.moveFiles(files);
                }));
            }
            if (dataTransfer.copy.length > 0) {
                this.logAndLoadWrapper(Promise.all(getFiles(dataTransfer.copy))
                    .then((files) => {
                    this.copyFiles(files);
                }));
            }
        }
    }
    onFileRowDoubleClick(fileRow) {
        let file = fileRow.file;
        let path = fileRow.path;
        if (file !== null) {
            if (file instanceof base_1.Directory) {
                if (path !== null) {
                    this.path = path;
                }
            }
            else {
                if (file.url !== null) {
                    if (file.url.startsWith('data')) {
                        // Download if its a data url.
                        let link = document.createElement('a');
                        link.href = file.url || "";
                        link.setAttribute('download', file.name);
                        link.click();
                    }
                    else {
                        window.open(file.url);
                    }
                }
            }
        }
    }
    onCutOrCopy(event) {
        event.preventDefault();
        let urlList = "";
        let paths = [];
        for (let row of this.table.selectedRows) {
            if (row instanceof FileTableRow) {
                let file = row.file;
                let path = row.path;
                if (file !== null && file.url !== null) {
                    urlList += file.url + '\r\n';
                }
                if (path !== null) {
                    paths.push(path);
                }
            }
        }
        event.clipboardData.setData('text/plain', urlList);
        let dataTransfer = {
            move: [],
            copy: [],
        };
        if (event.type === 'copy') {
            dataTransfer.copy = dataTransfer.copy.concat(paths);
        }
        else if (event.type == 'cut') {
            dataTransfer.move = dataTransfer.move.concat(paths);
        }
        event.clipboardData.setData(FileBrowser.dataTransferType, JSON.stringify(dataTransfer));
    }
    onPaste(event) {
        this.handleDataTransfer(event.clipboardData);
    }
    // Default element creation
    getNewTable() {
        return document.createElement('selectable-table');
    }
    getNewBreadCrumbs() {
        return document.createElement('bread-crumbs');
    }
    getNewFileTableHeader() {
        return document.createElement('file-header');
    }
    getNewFileTableRow() {
        return document.createElement('file-row');
    }
    // Utility functions
    setTableData(rowData) {
        let tableRows = [];
        for (let data of rowData) {
            let tableRow = this.getNewFileTableRow();
            tableRow.file = data.file;
            tableRow.path = data.path;
            if (data.file instanceof base_1.Directory) {
                tableRow.addDragoverAction(() => {
                    if (data.path !== null) {
                        this.path = data.path;
                    }
                });
            }
            tableRows.push(tableRow);
        }
        this.table.rows = tableRows;
        this.dispatchEvent(new Event(FileBrowser.EVENT_FILES_CHANGE));
    }
    search(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            this.clearMessages();
            if (searchTerm) {
                yield this.logAndLoadWrapper((() => __awaiter(this, void 0, void 0, function* () {
                    let searchResults = yield this.currentDirectory.search(searchTerm);
                    // Normalize relative path to the root directory for each result
                    let currentPath = this.path;
                    let normalizedResults = [];
                    for (let result of searchResults) {
                        normalizedResults.push({
                            file: result.file,
                            path: currentPath.concat(result.path),
                        });
                    }
                    let readablePath = this.path.join('/');
                    this.addMessage(`${searchResults.length} search results for "${searchTerm}" in ${readablePath}.`);
                    yield this.setTableData(normalizedResults);
                }))());
            }
            else {
                yield this.logAndLoadWrapper(this.resetFiles());
            }
        });
    }
    showVisibleColumnsDialog(positionX, positionY) {
        this.table.showVisibleColumnsDialog(positionX, positionY);
    }
    showContextMenu(positionX, positionY) {
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
    execute(path) {
        let console = new console_1.ConsoleFile();
        if (path.length > 0 && path[0] === this.rootDirectory.name) {
            // make sure path relative to root directory
            new base_2.Process(null, this.rootDirectory, path.slice(1), console, console);
        }
        else {
            throw new Error(`invalid path`);
        }
    }
    addMessage(message, isError) {
        console.log(message);
        console.trace();
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
    resetFiles() {
        this.busy = (() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.busy;
            }
            catch (e) { }
            let children = yield this.currentDirectory.getChildren();
            let rowData = children.map((child) => {
                return {
                    path: this.path.concat([child.name]),
                    file: child,
                };
            });
            yield this.setTableData(rowData);
        }))();
        return this.busy;
    }
    refreshFiles() {
        this.cachedCurrentDirectory.clearCache();
        return this.resetFiles();
    }
}
// Class names
FileBrowser.actionsContainerClass = 'file-actions-container';
FileBrowser.tableContainerClass = 'file-table-container';
FileBrowser.tableIconClass = 'icon';
FileBrowser.activeAjaxClass = 'ajax-active';
FileBrowser.searchInputClass = 'file-search-input';
FileBrowser.messageContainerClass = 'file-message-container';
FileBrowser.menuContainerClass = 'file-menu-container';
FileBrowser.stateManagerContainerClass = 'file-breadcrumbs-container';
FileBrowser.buttonClass = 'button';
FileBrowser.fileBrowserDialogClass = 'file-browser-dialog';
FileBrowser.dataTransferType = 'text/table-rows';
FileBrowser.selectMultipleAttribute = 'select-multiple';
FileBrowser.showHiddenAttribute = 'show-hidden';
/**
 * @event
 */
FileBrowser.EVENT_FILES_CHANGE = 'change';
/**
 * @event
 */
FileBrowser.EVENT_SELECTED_FILES_CHANGE = 'selected-change';
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
class ConfigurableFileBrowser extends FileBrowser {
    constructor() {
        super();
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
    static get configPaths() {
        return [
            this.sharedConfigPath,
            this.localConfigPath
        ];
    }
    set config(configObject) {
        let visibleColumns = configObject.visibleColumns;
        if (visibleColumns !== null) {
            for (let column of this.table.columns) {
                column.visible = visibleColumns.includes(column.name);
            }
        }
        let defualtSortColumn = configObject.defaultSortColumn;
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
                    this.setTableData(Object.values(this.getCurrentDirectory().data)); // Refresh data to resort with default sort
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
                    this.addLocalConfig({ visibleColumns: visibleColumnNames })
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
            let path = ConfigurableFileBrowser.localConfigPath.slice();
            let directory = this.rootDirectory;
            let configFileName = path.pop();
            if (configFileName === undefined) {
                throw new Error('config file path must have a name');
            }
            let nextName = path.shift();
            while (nextName !== undefined) {
                try {
                    let nextFile = yield directory.getFile([nextName]);
                    if (nextFile instanceof base_1.Directory) {
                        directory = nextFile;
                    }
                    else {
                        throw Error(`file named ${nextName} already exists`);
                    }
                }
                catch (error) {
                    if (error instanceof base_1.FileNotFoundError) {
                        directory = yield directory.addDirectory(nextName);
                    }
                    else {
                        throw error;
                    }
                }
            }
            return yield directory.addFile(utils_1.stringToArrayBuffer(""), configFileName, 'text/plain');
        });
    }
    addLocalConfig(newConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let dataBuffer;
            let configFileObject;
            try {
                configFileObject = yield this.rootDirectory.getFile(ConfigurableFileBrowser.localConfigPath);
                let oldDataBuffer = yield configFileObject.read();
                dataBuffer = yield config_1.updateConfigFile(newConfig, oldDataBuffer);
                yield configFileObject.write(dataBuffer);
            }
            catch (error) {
                if (error instanceof base_1.FileNotFoundError) {
                    configFileObject = yield this.addLocalConfigFile();
                    dataBuffer = yield config_1.updateConfigFile(newConfig);
                    yield configFileObject.write(dataBuffer);
                }
            }
        });
    }
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            let config = {};
            let configPath = ConfigurableFileBrowser.configPaths.slice();
            let currentPath = configPath.shift();
            while (currentPath !== undefined) {
                let currentConfig;
                try {
                    let configFileObject = yield this.rootDirectory.getFile(currentPath);
                    let data = yield configFileObject.read();
                    currentConfig = config_1.parseConfigFile(data);
                }
                catch (error) {
                    console.log(`Could not get config file at /${currentPath.join('/')}: ${error}`);
                    currentConfig = {};
                }
                Object.assign(config, currentConfig);
                currentPath = configPath.shift();
            }
            return {
                visibleColumns: (config.visibleColumns || "").split(','),
                defaultSortColumn: config.defaultSortColumn || null,
            };
        });
    }
}
ConfigurableFileBrowser.localConfigPath = ['.config', 'browser'];
ConfigurableFileBrowser.sharedConfigPath = ['Files', '.config', 'browser'];
exports.ConfigurableFileBrowser = ConfigurableFileBrowser;
customElements.define('file-browser', FileBrowser);
customElements.define('file-row', FileTableRow);
customElements.define('file-header', FileTableHeader);
