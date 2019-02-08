import { CustomElement } from "elements/lib/element";
export default class History extends CustomElement {
    constructor();
    static readonly type: string;
    path: any;
    delimiter: any;
    startCharacter: any;
    render(): void;
    buildCrumb(name: any, path: any): any;
    buildDelimiter(text: any): HTMLLIElement;
    push(name: any): void;
    pop(): any;
}
