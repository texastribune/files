import "./breadCrumbs";
import "./messages";
import "./search";
import "./contextMenu";
import "elements/lib/table";
import "elements/lib/dialog";
import { BreadCrumbs } from "./breadCrumbs";
import { Directory, File } from "../files/base";
import { AbstractTableData, Header, Row, Table } from "elements/lib/table";
import { CachedProxyDirectory } from "../files/proxy";
import { CustomElement } from "elements/lib/element";
export declare class FileSizeTableData extends AbstractTableData<File | null> {
    private file;
    data: File | null;
    compare(dataElement: AbstractTableData<File | null>): number;
}
export declare class FileTableData extends AbstractTableData<File | null> {
    private readonly folderIcon;
    private readonly documentIcon;
    private file;
    static hoverImageClass: string;
    constructor();
    data: File | null;
    compare(dataElement: AbstractTableData<File | null>): number;
}
export declare class PathTableData extends AbstractTableData<string[]> {
    data: string[];
    compare(dataElement: AbstractTableData<string[]>): number;
}
interface RowData {
    path: string[];
    file: File;
}
/**
 * An element for browsing a file system.
 * @param {Directory} currentDirectory - The root directory of the browser.
 * @param {Table} table - The table to use for displaying the files.
 */
export declare class FileBrowser extends CustomElement {
    static actionsContainerClass: string;
    static tableContainerClass: string;
    static tableIconClass: string;
    static activeAjaxClass: string;
    static searchInputClass: string;
    static messageContainerClass: string;
    static menuContainerClass: string;
    static stateManagerContainerClass: string;
    static buttonClass: string;
    static fileBrowserDialogClass: string;
    static dataTransferType: string;
    static selectMultipleAttribute: string;
    static showHiddenAttribute: string;
    /**
     * @event
     */
    static EVENT_DIRECTORY_CHANGE: string;
    /**
     * @event
     */
    static EVENT_FILES_CHANGE: string;
    /**
     * @event
     */
    static EVENT_SELECTED_FILES_CHANGE: string;
    private maxNumMove;
    private maxNumCopy;
    private busy;
    private activePromises;
    private readonly actionsContainer;
    private readonly messagesContainer;
    private readonly menusContainer;
    private readonly searchElement;
    private readonly tableContainer;
    private readonly tableBusyOverlay;
    private readonly breadCrumbs;
    private readonly table;
    private cachedCurrentDirectory;
    private readonly dropdownMenuIcon;
    private readonly carrotIcon;
    constructor();
    static readonly observedAttributes: string[];
    rootDirectory: Directory;
    readonly currentDirectory: Directory;
    protected setCurrentDirectory<T extends Directory>(value: CachedProxyDirectory<T>): void;
    readonly files: File[];
    readonly selectedFileRows: Row[];
    readonly selectedRowData: RowData[];
    readonly selectedFiles: File[];
    readonly selectedPaths: string[][];
    filePath: string[];
    selectMultiple: boolean;
    showHidden: boolean;
    readonly css: string;
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    render(shadowRoot: ShadowRoot): void;
    loadingWrapper(promise: Promise<void>): Promise<void>;
    errorLoggingWrapper(promise: Promise<void>): Promise<void>;
    logAndLoadWrapper(promise: Promise<void>): Promise<void>;
    private copyUrl;
    private moveFiles;
    private copyFiles;
    handleDataTransfer(dataTransfer: DataTransfer): void;
    onFileRowDoubleClick(row: Row): void;
    onCutOrCopy(event: ClipboardEvent): void;
    onPaste(event: ClipboardEvent): void;
    protected getNewTable(): Table;
    protected getNewBreadCrumbs(): BreadCrumbs;
    protected getNewFileTableHeader(): Header;
    protected getNewFileTableRow(rowData: RowData): Row;
    protected getRowDataFromRow(row: Row): RowData;
    protected setTableData(rowData: RowData[]): void;
    search(searchTerm: string): Promise<void>;
    showVisibleColumnsDialog(positionX: number, positionY: number): void;
    showContextMenu(positionX: number, positionY: number): void;
    execute(path: string[]): void;
    addMessage(message: Error | string, isError?: boolean): void;
    clearMessages(): void;
    resetFiles(): Promise<void>;
    refreshFiles(): Promise<void>;
}
export {};
