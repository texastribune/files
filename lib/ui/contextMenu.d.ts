import { Dialog } from "./elements/dialog.js";
import { File } from "../files/base.js";
import { FileBrowser, RowData } from "./browser.js";
export declare class ContextMenu extends Dialog {
    constructor();
    readonly css: string;
    getItems(browser: FileBrowser, selectedRowData: RowData[]): HTMLDivElement[];
    createOpenButton(browser: FileBrowser, rowData: RowData): HTMLDivElement;
    createCopyUrlButton(url: string): HTMLDivElement;
    createCopyIdButton(id: string): HTMLDivElement;
    createRenameButton(browser: FileBrowser, selectedFile: File): HTMLDivElement;
    createRunButton(browser: FileBrowser, path: string[]): HTMLDivElement;
    createDeleteButton(browser: FileBrowser, selectedFiles: File[]): HTMLDivElement;
    createMoveButton(browser: FileBrowser, selectedFiles: File[]): HTMLDivElement;
    createAddFileButton(browser: FileBrowser): HTMLDivElement;
    createAddDirectoryButton(browser: FileBrowser): HTMLDivElement;
    createShowHiddenButton(browser: FileBrowser): HTMLDivElement;
    createVisibleColumnsButton(browser: FileBrowser): HTMLDivElement;
}
