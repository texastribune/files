import { CustomElement } from "elements/lib/element.js";
import { Directory } from "../files/base.js";
/**
 * An custom element that represents a {@link Directory} instance. Can be added as a
 * child of {@link FileBrowser} to browse the directory in an HTML document.
 */
export declare abstract class DirectoryElement extends CustomElement {
    abstract readonly directory: Directory;
    refresh(): void;
}
