import { CustomElement } from "elements/lib/element.js";
import { Directory } from "../files/base.js";
export declare abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory: Directory;
    refresh(): void;
}
