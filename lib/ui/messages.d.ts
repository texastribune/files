import { CustomElement } from "./elements/element.js";
export declare class Message extends CustomElement {
    private delay;
    static className: string;
    constructor();
    static readonly observedAttributes: string[];
    readonly css: string;
    message: string;
    updateFromAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    connectedCallback(): void;
}
