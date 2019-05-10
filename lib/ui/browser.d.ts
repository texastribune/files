import "./breadCrumbs.js";
import "./messages.js";
import "./search.js";
import "./contextMenu.js";
import "elements/lib/table.js";
import "elements/lib/dialog.js";
import { BreadCrumbs } from "./breadCrumbs.js";
import { Directory, File } from "../files/base.js";
import { AbstractTableData, Header, Row, Table } from "elements/lib/table.js";
import { CachedProxyDirectory } from "../files/proxy.js";
export declare class FileSizeTableData extends AbstractTableData<File | null> {
    private file;
    data: File | null;
    compare(dataElement: AbstractTableData<File | null>): number;
}
export declare class FileTableData extends AbstractTableData<File | null> {
    private readonly folderIcon;
    private readonly documentIcon;
    private file;
    private readonly iconContainer;
    static hoverImageClass: string;
    constructor();
    data: File | null;
    readonly css: string;
    compare(dataElement: AbstractTableData<File | null>): number;
}
export declare class PathTableData extends AbstractTableData<string[]> {
    data: string[];
    compare(dataElement: AbstractTableData<string[]>): number;
}
export interface RowData {
    path: string[];
    file: File;
}
/**
 * An element for browsing a directory.
 * @param {Directory} currentDirectory - The root directory of the browser.
 * @param {Table} table - The table to use for displaying the files.
 */
export declare class FileBrowser extends Table {
    static actionsContainerId: string;
    static tableIconClass: string;
    static activeAjaxClass: string;
    static messageContainerId: string;
    static menuContainerId: string;
    static bodyContainerId: string;
    static overlayId: string;
    static buttonClass: string;
    static dataTransferType: string;
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
    private readonly bodyContainer;
    private readonly tableBusyOverlay;
    private readonly breadCrumbs;
    private readonly tableHeader;
    private cachedCurrentDirectory;
    private readonly dropdownMenuIcon;
    private readonly carrotIcon;
    constructor();
    rootDirectory: Directory;
    readonly currentDirectory: Directory;
    protected setCurrentDirectory<T extends Directory>(value: CachedProxyDirectory<T>): void;
    readonly files: File[];
    readonly selectedFileRows: Row[];
    readonly selectedRowData: RowData[];
    readonly selectedFiles: File[];
    readonly selectedPaths: string[][];
    filePath: string[];
    readonly css: string;
    connectedCallback(): void;
    loadingWrapper(promise: Promise<void>): Promise<void>;
    errorLoggingWrapper(promise: Promise<void>): Promise<void>;
    logAndLoadWrapper(promise: Promise<void>): Promise<void>;
    private copyUrl;
    private moveFiles;
    private copyFiles;
    handleDataTransfer(dataTransfer: DataTransfer): void;
    onOpen(rowData: RowData): void;
    onCutOrCopy(event: ClipboardEvent): void;
    onPaste(event: ClipboardEvent): void;
    protected getNewBreadCrumbs(): BreadCrumbs;
    protected getNewFileTableHeader(): Header;
    protected getNewFileTableRow(rowData: RowData): Row;
    protected getRowDataFromRow(row: Row): RowData;
    protected setTableData(rowData: RowData[]): void;
    search(searchTerm: string): Promise<void>;
    showContextMenu(positionX: number, positionY: number): void;
    execute(path: string[]): void;
    addMessage(message: Error | string, isError?: boolean): void;
    clearMessages(): void;
    resetFiles(): Promise<void>;
    refreshFiles(): Promise<void>;
}
