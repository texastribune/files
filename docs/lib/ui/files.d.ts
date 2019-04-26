import { CustomElement } from "elements/lib/element";
import { Directory } from "../files/base";
export declare abstract class DirectoryElement extends CustomElement {
    protected abstract readonly directory: Directory;
    refresh(): void;
}
