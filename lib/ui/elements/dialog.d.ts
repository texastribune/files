import { Grabbable } from "./movable";
/**
 * A movable dialog element
 * CSS variables for theming:
 *    --dialog-header-height
 *    --dialog-header-background-color
 *    --dialog-header-text-color
 *    --dialog-background
 *    --dialog-font
 */
export declare class Dialog extends Grabbable {
    static deleteButtonId: string;
    static expandButtonId: string;
    static nameId: string;
    static headerId: string;
    static containerId: string;
    /**
     * @event
     */
    static EVENT_OPENED: string;
    /**
     * @event
     */
    static EVENT_CLOSED: string;
    static DETETE_BUTTON_URL: string;
    static EXPAND_BUTTON_URL: string;
    static expandedAttribute: string;
    static visibleAttribute: string;
    static nameAttribute: string;
    onShow: ((dialog: Dialog) => void) | null;
    onClose: ((dialog: Dialog) => void) | null;
    onRemove: ((dialog: Dialog) => void) | null;
    protected readonly noPropagate = true;
    private readonly nameElement;
    private readonly headerElement;
    private readonly containerElement;
    private readonly documentClickListener;
    private opened;
    constructor();
    static readonly observedAttributes: string[];
    readonly css: string;
    /**
    *
    * @param {string} value
    */
    name: string;
    visible: boolean;
    expanded: boolean;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    remove(): void;
    /**
     *  Checks if click is in dialog or one of one of its child dialogs and if not closes.
     */
    private closeOnOutsideClick;
}
export declare class ConfirmDialog extends Dialog {
    /**
     * @event
     */
    static EVENT_CONFIRMED: string;
    static confirmButtonId: string;
    static confirmationTextAttribute: string;
    static disabledAttribute: string;
    private readonly confirmButton;
    constructor();
    static readonly observedAttributes: string[];
    readonly css: string;
    confirmationText: string;
    disabled: boolean;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    onConfirmed(event: Event): void;
}
