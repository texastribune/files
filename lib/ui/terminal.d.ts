import { Element } from "./element.js";
import { Dialog } from "./dialog.js";
export declare class Terminal extends Element {
    constructor(fileSystem: any);
    readonly startText: any;
    readonly pathString: any;
    lines: any;
    execute(): Promise<void>;
    moveCursorToEnd(): void;
    refreshText(): void;
}
export declare class TerminalDialog extends Dialog {
    constructor(fileSystem: any);
    shouldOpen(event: any): boolean;
}
