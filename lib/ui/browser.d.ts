import "./breadCrumbs.js";
import "./messages.js";
import "./search.js";
import "./contextMenu.js";
import "./elements/table.js";
import "./elements/dialog.js";
import { BreadCrumbs } from "./breadCrumbs.js";
import { Directory, File } from "../files/base.js";
import { AbstractTableData, Header, Row } from "./elements/table.js";
import { CachedProxyDirectoryBase } from "../files/proxy.js";
import { CustomElement } from "./elements/element.js";
export declare class FileSizeTableData extends AbstractTableData<File | null> {
    private file;
    get data(): File | null;
    set data(value: File | null);
    compare(dataElement: AbstractTableData<File | null>): number;
}
export declare class FileTableData extends AbstractTableData<File | null> {
    private readonly folderIcon;
    private readonly documentIcon;
    private file;
    private readonly iconContainer;
    static hoverImageClass: string;
    constructor();
    get data(): File | null;
    set data(value: File | null);
    get css(): string;
    compare(dataElement: AbstractTableData<File | null>): number;
}
export declare class PathTableData extends AbstractTableData<string[]> {
    get data(): string[];
    set data(value: string[]);
    compare(dataElement: AbstractTableData<string[]>): number;
}
export interface RowData {
    path: string[];
    file: File;
}
/**
 * An custom element for browsing a directory. Add an implementation of {@link DirectoryElement}
 * to browse the contents of a certain directory. Add a {@link ContextMenu} element as a child to
 * have a context menu.
 */
export declare class FileBrowser extends CustomElement {
    static actionsContainerId: string;
    static tableIconClass: string;
    static activeAjaxClass: string;
    static messageContainerId: string;
    static menuContainerId: string;
    static bodyContainerId: string;
    static tableId: string;
    static overlayId: string;
    static buttonClass: string;
    static gridItemClass: string;
    static dataTransferType: string;
    static showHiddenAttribute: string;
    static selectMultipleAttribute: string;
    static gridAttribute: string;
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
    private lastSearch;
    private readonly actionsContainer;
    private readonly messagesContainer;
    private readonly menusContainer;
    private readonly searchElement;
    private readonly tableContainer;
    private readonly tableBusyOverlay;
    private readonly breadCrumbs;
    private cachedCurrentDirectory;
    private readonly table;
    private readonly dropdownMenuIcon;
    private readonly carrotIcon;
    private readonly cutAndCopyListener;
    private readonly pasteListener;
    constructor();
    static get observedAttributes(): string[];
    get rootDirectory(): Directory;
    set rootDirectory(value: Directory);
    get currentDirectory(): Directory;
    protected setCurrentDirectory<T extends Directory>(value: CachedProxyDirectoryBase<T>): void;
    get files(): File[];
    get selectedFileRows(): Row[];
    get selectedRowData(): RowData[];
    get selectedFiles(): File[];
    get selectedPaths(): string[][];
    get filePath(): string[];
    set filePath(path: string[]);
    get selectMultiple(): boolean;
    set selectMultiple(value: boolean);
    get showHidden(): boolean;
    set showHidden(value: boolean);
    get css(): string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    /**
     * Add loading class to element while waiting on the async call.
     */
    loadingWrapper(promise: Promise<any>): Promise<void>;
    /**
     * Catch and log any errors that happen during the execution of the call.
     */
    errorLoggingWrapper<T>(promise: Promise<T>): Promise<T | void>;
    /**
     * Combine the actions in loadingWrapper and errorLoggingWrapper.
     */
    logAndLoadWrapper(promise: Promise<any>): Promise<void>;
    private copyUrl;
    private moveFiles;
    private copyFiles;
    handleDataTransfer(dataTransfer: DataTransfer): void;
    onOpen(rowData: RowData): void;
    onCutOrCopy(event: ClipboardEvent): void;
    onPaste(event: ClipboardEvent): void;
    protected getNewBreadCrumbs(): BreadCrumbs;
    protected getNewFileTableHeaderColumns(): AbstractTableData<any>[];
    protected getNewFileTableHeader(): Header;
    protected getNewFileTableRowColumns(rowData: RowData): AbstractTableData<any>[];
    protected getNewFileTableRow(rowData: RowData): Row;
    protected getRowDataFromRow(row: Row): RowData;
    protected setTableData(rowData: RowData[]): void;
    search(searchTerm: string): void;
    showVisibleColumnsDialog(positionX: number, positionY: number): void;
    showContextMenu(positionX: number, positionY: number): void;
    execute(path: string[]): void;
    addMessage(message: Error | string, isError?: boolean): void;
    clearMessages(): void;
    resetFiles(): Promise<void>;
    refreshFiles(): Promise<void>;
}
