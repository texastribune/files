import { CustomElement } from "elements/lib/element";
export declare class Message extends CustomElement {
    private delay;
    static className: string;
    static readonly observedAttributes: string[];
    readonly css: string;
    message: any;
    render(shadowRoot: ShadowRoot): void;
    updateAttributes(attributes: {
        [p: string]: string | null;
    }): void;
    connectedCallback(): void;
}
