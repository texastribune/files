import { CustomElement } from 'elements/lib/element.js';
export declare class BreadCrumbs extends CustomElement {
    private startCharacter;
    private delimiter;
    private readonly ul;
    /**
     * @event
     */
    static EVENT_PATH_CHANGE: string;
    constructor();
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    readonly css: string;
    readonly crumbs: Iterable<HTMLAnchorElement>;
    path: string[];
    buildCrumb(path: string[]): HTMLLIElement;
    buildDelimiter(char: string): HTMLElement;
}
