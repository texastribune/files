import { CustomElement } from "./elements/element.js";
export declare class Message extends CustomElement {
    private delay;
    static className: string;
    constructor();
    static get observedAttributes(): string[];
    get css(): string;
    get message(): string;
    set message(value: string);
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    connectedCallback(): void;
}
