import { CustomElement } from './elements/element.js';
export declare class BreadCrumbs extends CustomElement {
    private delimiter;
    private readonly ul;
    static emptyCharacter: string;
    /**
     * @event
     */
    static EVENT_PATH_CHANGE: string;
    constructor();
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    get css(): string;
    get crumbs(): Iterable<HTMLAnchorElement>;
    get path(): string[];
    set path(value: string[]);
    buildCrumb(path: string[]): HTMLLIElement;
    buildDelimiter(char: string): HTMLElement;
}
