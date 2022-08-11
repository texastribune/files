export interface HTMLElementWithCallbacks extends HTMLElement {
    connectedCallback(): void;
    disconnectedCallback(): void;
}
/**
 * Basic element class with some utilities to help extend HTMLElement. Add all persitant elements
 * to the shadowDOM in the constructor. Update state from attributes in updateFromAttributes.
 */
export declare abstract class CustomElement extends HTMLElement implements HTMLElementWithCallbacks {
    readonly shadowDOM: ShadowRoot;
    protected htmlElement: HTMLDivElement | null;
    protected readonly styleElement: HTMLStyleElement;
    private needsRefresh;
    protected constructor();
    static get observedAttributes(): string[];
    get css(): string;
    get html(): string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: any): void;
    /**
     * Remove every child element from shadow dom
     */
    removeShadowChildren(): void;
    /**
     * Remove every child element
     */
    removeChildren(type?: any): void;
    /**
     * Add child to the shadow dom
     */
    appendShadowChild(element: Element): void;
    /**
     * Add children in bulk to the shadow dom
     */
    appendShadowChildren(elements: Element[] | NodeList): void;
    /**
     * Add children in bulk to this element
     */
    appendChildren(elements: Element[] | NodeList): void;
    /**
     * All descendents recursively. Optionally filtered by type.
     */
    flatChildren<T extends Element>(type?: new () => T): T[];
    /**
     * Gets all current attributes and values and calls render.
     */
    refresh(): void;
    /**
     * Updates state and renders the shadow dom. By default adds the string returned by template to the innerHTML
     * of a div in the shadow dom and the css to a style element in the shadow dom.
     * @param attributes - The current attributes and their values defined on the html element.
     */
    render(attributes: {
        [name: string]: string | null;
    }): void;
    /**
     * Updates the state of this element and any DOM updates. Called when any updates are made to the
     * observed attributes of this element. All important state should be stored via the attributes,
     * so all updates should be made here.
     */
    abstract updateFromAttributes(attributes: {
        [name: string]: string | null;
    }): void;
}
