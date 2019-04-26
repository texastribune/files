import { CustomElement } from "elements/lib/element";
export declare class BreadCrumbs extends CustomElement {
    private startCharacter;
    private delimiter;
    private readonly ul;
    /**
     * @event
     */
    static EVENT_PATH_CHANGE: string;
    constructor();
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    readonly css: string;
    readonly crumbs: Iterable<HTMLAnchorElement>;
    path: string[];
    render(shadowRoot: ShadowRoot): void;
    buildCrumb(path: string[]): HTMLLIElement;
    buildDelimiter(char: string): HTMLElement;
}