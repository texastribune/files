import { CustomElement } from "elements/lib/element.js";
export declare class SearchBar extends CustomElement {
    private readonly input;
    private readonly container;
    private searchPending;
    static debounceAttribute: string;
    /**
     * @event
     */
    static EVENT_SEARCH_CHANGE: string;
    /**
     * milliseconds between search events for debounce purposes
     */
    static DEFAULT_DEBOUNCE: number;
    constructor();
    readonly css: string;
    static readonly observedAttributes: string[];
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    private dispatchSearchEvent;
    readonly value: string;
    debounce: number | null;
}
