import { File, Directory } from "../files/base";
import { Row, Data } from "elements/lib/table";
import { CachedProxyDirectory } from "../files/proxy";
import { CustomElement } from "elements/lib/element";
declare class FileTableRow extends Row {
    private file;
    private readonly folderIcon;
    private readonly documentIcon;
    constructor();
    getFile(): File | null;
    setFile(value: File): void;
    createNameColumn(): Data;
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
    static searchContainerClass: string;
    static stateManagerContainerClass: string;
    static dropdownMenuButtonClass: string;
    static fileBrowserDialogClass: string;
    /**
     * @event
     */
    static EVENT_FILES_CHANGE: string;
    private searchPending;
    private messageRemovalDelay;
    private maxNumMove;
    private busy;
    private readonly actionsContainer;
    private readonly messagesContainer;
    private readonly menusContainer;
    private readonly searchContainer;
    private readonly tableContainer;
    private readonly breadCrumbs;
    private readonly table;
    private readonly fileContextMenu;
    private cachedCurrentDirectory;
    private readonly dropdownMenuIcon;
    private readonly carrotIcon;
    private readonly searchIcon;
    constructor();
    static readonly observedAttributes: never[];
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    rootDirectory: Directory;
    currentDirectory: CachedProxyDirectory;
    readonly files: File[];
    path: string[];
    readonly css: string | null;
    render(shadowRoot: ShadowRoot): void;
    loadingWrapper(promise: Promise<void>): Promise<void>;
    errorLoggingWrapper(promise: Promise<void>): Promise<void>;
    logAndLoadWrapper(promise: Promise<void>): Promise<void>;
    createSearchElements(): HTMLDivElement;
    createMenus(): HTMLDivElement;
    handleDataTransfer(dataTransfer: DataTransfer): Promise<void>;
    search(searchTerm: string): Promise<void>;
    /**
     * Translate the data for a AbstractFile to the data that will be in each table row for that file.
     */
    private fileObjectToTableRow;
    setTableData(files: File[]): void;
    showContextMenu(positionX: number, positionY: number): void;
    getMenuItems(selectedFileRows: FileTableRow[]): HTMLDivElement[];
    addMessage(message: Error | string, isError?: boolean): void;
    clearMessages(): void;
    refreshFiles(): Promise<void>;
}
export declare class DialogBrowser extends FileBrowser {
    /**
     * An file browser inside a dialog.
     */
    constructor(currentDirectory: any, table: any, dialog: any);
    readonly dialog: any;
}
export declare let ConfigFileMixin: (currentDirectoryClass: any) => {
    new (...args: any[]): {
        [x: string]: any;
        config: any;
        setupTable(): void;
        addLocalConfigFile(): Promise<void>;
        addLocalConfig(newConfig: any): Promise<void>;
        getConfig(): Promise<{}>;
    };
    [x: string]: any;
    readonly localConfigPath: string[];
    readonly sharedConfigPath: string[];
    readonly configPaths: string[][];
};
export {};
