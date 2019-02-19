import { File, Directory } from "../files/base";
import { Row } from "elements/lib/table";
import { CustomElement } from "elements/lib/element";
declare class FileTableRow extends Row {
    private file;
    getFile(): File | null;
    setFile(value: File): void;
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
    static contextMenuClass: string;
    static dropdownMenuButtonClass: string;
    static fileBrowserDialogClass: string;
    private searchPending;
    private messageRemovalDelay;
    private maxNumMove;
    private busy;
    private readonly actionsContainer;
    private readonly messagesContainer;
    private readonly menusContainer;
    private readonly searchContainer;
    private readonly tableContainer;
    private readonly history;
    private readonly table;
    private readonly contextMenu;
    private currentDirectory;
    private readonly dropdownMenuIcon;
    private readonly carrotIcon;
    private readonly searchIcon;
    private readonly folderIcon;
    private readonly documentIcon;
    constructor();
    static readonly observedAttributes: never[];
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    private static createIconTemplate;
    rootDirectory: Directory;
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
