import { CustomElement } from "./elements/element.js";
export declare class SearchBar extends CustomElement {
    private readonly input;
    private readonly container;
    private timeout;
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
    get css(): string;
    static get observedAttributes(): string[];
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    private dispatchSearchEvent;
    get value(): string;
    get debounce(): number | null;
    set debounce(value: number | null);
}
