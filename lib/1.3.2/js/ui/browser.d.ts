import "./breadCrumbs";
import "./messages";
import "./search";
import "elements/lib/table";
import "elements/lib/dialog";
import { Directory, File } from "../files/base";
import { Row } from "elements/lib/table";
import { CachedProxyDirectory } from "../files/proxy";
import { CustomElement } from "elements/lib/element";
interface RowData {
    path: string[];
    file: File;
}
declare class FileTableRow extends Row {
    private _file;
    private _path;
    private readonly folderIcon;
    private readonly documentIcon;
    static hoverImageClass: string;
    constructor();
    readonly css: string;
    file: File | null;
    path: string[] | null;
    handleDragStart(event: DragEvent): void;
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
    private readonly fileContextMenu;
    private cachedCurrentDirectory;
    private readonly dropdownMenuIcon;
    private readonly carrotIcon;
    constructor();
    static readonly observedAttributes: never[];
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    rootDirectory: Directory;
    protected currentDirectory: CachedProxyDirectory;
    readonly files: File[];
    readonly selectedFileRows: FileTableRow[];
    readonly selectedFiles: File[];
    path: string[];
    readonly css: string;
    render(shadowRoot: ShadowRoot): void;
    loadingWrapper(promise: Promise<void>): Promise<void>;
    errorLoggingWrapper(promise: Promise<void>): Promise<void>;
    logAndLoadWrapper(promise: Promise<void>): Promise<void>;
    createMenus(): HTMLDivElement;
    private copyUrl;
    private moveFiles;
    private copyFiles;
    handleDataTransfer(dataTransfer: DataTransfer): void;
    onFileRowDoubleClick(fileRow: FileTableRow): void;
    onCutOrCopy(event: ClipboardEvent): void;
    onPaste(event: ClipboardEvent): void;
    search(searchTerm: string): Promise<void>;
    setTableData(rowData: RowData[]): void;
    showContextMenu(positionX: number, positionY: number): void;
    getMenuItems(): HTMLDivElement[];
    execute(path: string[]): void;
    addMessage(message: Error | string, isError?: boolean): void;
    clearMessages(): void;
    resetFiles(): Promise<void>;
    refreshFiles(): Promise<void>;
}
export declare class DialogBrowser extends FileBrowser {
    /**
     * An file browser inside a dialog.
     */
    constructor(currentDirectory: any, table: any, dialog: any);
    readonly dialog: any;
}
interface BrowserConfig {
    visibleColumns: string[] | null;
    defaultSortColumn: string | null;
}
export declare class ConfigurableFileBrowser extends FileBrowser {
    static localConfigPath: string[];
    static sharedConfigPath: string[];
    constructor();
    static readonly configPaths: string[][];
    config: BrowserConfig;
    setupTable(): void;
    addLocalConfigFile(): File;
    addLocalConfig(newConfig: BrowserConfig): Promise<void>;
    getConfig(): Promise<BrowserConfig>;
}
export {};
