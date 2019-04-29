var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ConfirmDialog, Dialog } from "elements/lib/dialog.js";
import { Directory } from "../files/base.js";
import { fileToArrayBuffer } from "../utils.js";
import { FileBrowser } from "./browser.js";
const executableMimeTypes = [
    'application/javascript',
    'application/x-javascript',
    'text/javascript',
];
export class ContextMenu extends Dialog {
    constructor() {
        super();
        this.addEventListener(Dialog.EVENT_OPENED, (event) => {
            if (this.parentElement instanceof FileBrowser) {
                this.removeChildren();
                let selectedRowData = this.parentElement.selectedRowData;
                this.appendChildren(this.getItems(this.parentElement, selectedRowData));
            }
        });
    }
    get css() {
        // language=CSS
        return super.css + `
      ::slotted(*){
          margin: 5px;
          cursor: pointer;
      }
    `;
    }
    getItems(browser, selectedRowData) {
        let items = [];
        if (selectedRowData.length === 1) {
            items.push(this.createOpenButton(browser, selectedRowData[0]));
        }
        // Add items that should exist only when there is selected data.
        if (selectedRowData.length > 0) {
            // Add items that should exist only when there is one selected item.
            if (selectedRowData.length === 1) {
                const selectedFile = selectedRowData[0].file;
                const selectedPath = selectedRowData[0].path;
                if (selectedFile.url) {
                    items.push(this.createCopyButton());
                }
                items.push(this.createRenameButton(browser, selectedFile));
                if (executableMimeTypes.includes(selectedFile.mimeType)) {
                    if (selectedPath !== null) {
                        items.push(this.createRunButton(browser, selectedPath));
                    }
                }
            }
            let selectedFiles = [];
            for (let rowData of selectedRowData) {
                selectedFiles.push(rowData.file);
            }
            items.push(this.createDeleteButton(browser, selectedFiles));
            items.push(this.createMoveButton(browser, selectedFiles));
        }
        items.push(this.createAddFileButton(browser));
        items.push(this.createAddDirectoryButton(browser));
        items.push(this.createShowHiddenButton(browser));
        items.push(this.createVisibleColumnsButton(browser));
        return items;
    }
    createOpenButton(browser, rowData) {
        let openButton = document.createElement('div');
        openButton.innerText = 'Open';
        openButton.onclick = () => {
            browser.onOpen(rowData);
            this.visible = false;
        };
        return openButton;
    }
    createCopyButton() {
        let urlButton = document.createElement('div');
        urlButton.innerText = 'Copy Url';
        urlButton.onclick = () => {
            document.execCommand('copy');
        };
        return urlButton;
    }
    createRenameButton(browser, selectedFile) {
        let renameButton = document.createElement('div');
        renameButton.innerText = 'Rename';
        renameButton.onclick = () => {
            browser.logAndLoadWrapper((() => __awaiter(this, void 0, void 0, function* () {
                let newName = prompt("New Name");
                if (newName !== null) {
                    this.visible = false;
                    yield selectedFile.rename(newName);
                }
            }))());
        };
        return renameButton;
    }
    createRunButton(browser, path) {
        let runButton = document.createElement('div');
        runButton.innerText = 'Run';
        runButton.onclick = () => {
            try {
                browser.execute(path);
            }
            catch (e) {
                browser.addMessage(e);
            }
        };
        return runButton;
    }
    createDeleteButton(browser, selectedFiles) {
        let deleteButton = document.createElement('div');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation(); // Prevent from closing new dialog immediately
            let deleteDialog = document.createElement('confirm-dialog');
            this.appendChild(deleteDialog);
            deleteDialog.addEventListener(Dialog.EVENT_CLOSED, () => {
                deleteDialog.remove();
            });
            let removeText = document.createElement('div');
            let names = [];
            for (let file of selectedFiles) {
                names.push(file.name);
            }
            removeText.innerText = `Are you sure you want to remove ${names.join(', ')}?`;
            let promises = [];
            deleteDialog.addEventListener(ConfirmDialog.EVENT_CONFIRMED, () => {
                for (let file of selectedFiles) {
                    promises.push(file.delete());
                }
                this.visible = false;
                browser.logAndLoadWrapper(Promise.all(promises).then(() => { }));
            });
            deleteDialog.appendChild(removeText);
            deleteDialog.center();
            deleteDialog.visible = true;
        };
        return deleteButton;
    }
    createMoveButton(browser, selectedFiles) {
        let moveButton = document.createElement('div');
        moveButton.innerText = 'Move';
        moveButton.onclick = (event) => {
            // Prevent from closing dialog immediately due to outside click
            event.preventDefault();
            event.stopPropagation();
            let moveBrowser = document.createElement('file-browser');
            moveBrowser.rootDirectory = browser.rootDirectory;
            let moveDialog = document.createElement('confirm-dialog');
            moveBrowser.selectMultiple = false;
            moveDialog.name = "Move Files";
            moveDialog.confirmationText = "Select";
            moveDialog.addEventListener(ConfirmDialog.EVENT_CONFIRMED, () => {
                let target;
                let moveSelection = moveBrowser.selectedFiles;
                let first = moveSelection[0];
                if (moveSelection.length === 1 && first instanceof Directory) {
                    target = first;
                }
                else {
                    target = moveBrowser.currentDirectory;
                }
                let movePromises = [];
                for (let file of selectedFiles) {
                    movePromises.push(file.move(target));
                }
                browser.logAndLoadWrapper(Promise.all(movePromises).then(() => { }));
            });
            this.appendChild(moveDialog);
            moveDialog.addEventListener(Dialog.EVENT_CLOSED, () => {
                moveDialog.remove();
            });
            moveDialog.center();
            moveDialog.visible = true;
        };
        return moveButton;
    }
    createAddFileButton(browser) {
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
            fileDialog.addEventListener(ConfirmDialog.EVENT_CONFIRMED, () => {
                let promises = [];
                if (fileInput.files !== null) {
                    for (let file of fileInput.files) {
                        promises.push(fileToArrayBuffer(file).then((buffer) => {
                            return browser.currentDirectory.addFile(buffer, file.name, file.type);
                        }));
                    }
                }
                this.visible = false;
                browser.logAndLoadWrapper(Promise.all(promises).then(() => { }));
            });
            fileDialog.appendChild(fileInputDiv);
            this.appendChild(fileDialog);
            fileDialog.center();
            fileDialog.visible = true;
        };
        return addFileButton;
    }
    createAddDirectoryButton(browser) {
        let addDirectoryButton = document.createElement('div');
        addDirectoryButton.innerText = 'Add Directory';
        addDirectoryButton.onclick = () => {
            let name = prompt("Directory Name");
            if (name !== null) {
                browser.logAndLoadWrapper(browser.currentDirectory.addDirectory(name).then(() => { }));
            }
            this.visible = false;
        };
        return addDirectoryButton;
    }
    createShowHiddenButton(browser) {
        let showHiddenButton = document.createElement('div');
        let showHiddenLabel = document.createElement('span');
        let showHiddenCheckbox = document.createElement('input');
        showHiddenCheckbox.type = 'checkbox';
        showHiddenCheckbox.checked = browser.showHidden;
        showHiddenLabel.innerText = 'Show Hidden';
        showHiddenCheckbox.onchange = () => {
            browser.showHidden = showHiddenCheckbox.checked;
        };
        showHiddenButton.appendChild(showHiddenLabel);
        showHiddenButton.appendChild(showHiddenCheckbox);
        return showHiddenButton;
    }
    createVisibleColumnsButton(browser) {
        let visibleColumnsButton = document.createElement('div');
        visibleColumnsButton.innerText = 'Visible Columns';
        visibleColumnsButton.onclick = (event) => {
            event.preventDefault();
            let rect = this.getBoundingClientRect();
            browser.showVisibleColumnsDialog(rect.right, rect.bottom);
        };
        return visibleColumnsButton;
    }
}
customElements.define('file-browser-context-menu', ContextMenu);
