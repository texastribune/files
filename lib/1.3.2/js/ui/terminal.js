import { Element } from "./element.js";
import { Dialog } from "./dialog.js";
export class Terminal extends Element {
    constructor(fileSystem) {
        super();
        this._fileSystem = fileSystem;
        this._maxLines = 20;
        this._pathDelimiter = '/';
        this._lineSplitter = '$';
        this.className = 'terminal';
        this.element.contentEditable = true;
        this.element.onkeydown = (event) => {
            this.moveCursorToEnd();
            if (event.key === "Backspace") {
                let lines = this.lines;
                if (lines[lines.length - 1] === this.startText) {
                    event.preventDefault();
                }
            }
            else if (event.key === "Enter") {
                event.preventDefault();
                this.execute();
            }
        };
        this.element.innerText = this.startText;
        this.onClose = null;
    }
    get startText() {
        return this.pathString + this._lineSplitter;
    }
    get pathString() {
        return this._pathDelimiter + this._fileSystem.path.join(this._pathDelimiter);
    }
    get lines() {
        return this.element.innerText.split('\n');
    }
    set lines(lines) {
        lines.push(this.startText);
        let cutoff = Math.max(0, lines.length - this._maxLines);
        this.element.innerText = lines.slice(cutoff).join('\n');
        this.moveCursorToEnd();
    }
    async execute() {
        let lines = this.lines;
        let lastLine = lines[lines.length - 1];
        let lastLineParts = lastLine.toString().split(this._lineSplitter);
        let tokens = lastLineParts[lastLineParts.length - 1].split(/[\s]+/);
        let command = tokens.shift();
        if (command) {
            if (command === 'exit' && this.onClose) {
                this.onClose();
            }
            else {
                let stringReturn;
                try {
                    stringReturn = await this._fileSystem.exec(command, ...tokens);
                }
                catch (error) {
                    stringReturn = error.message;
                }
                if (stringReturn) {
                    lines = lines.concat(stringReturn.toString().split('\n'));
                }
            }
        }
        this.lines = lines;
    }
    moveCursorToEnd() {
        let range = document.createRange();
        range.selectNodeContents(this.element);
        range.collapse(false);
        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
    refreshText() {
        this.element.innerText = this.startText;
        this.moveCursorToEnd();
    }
}
export class TerminalDialog extends Dialog {
    constructor(fileSystem) {
        super();
        this._terminal = new Terminal(fileSystem);
        this.items = [this._terminal.element];
        this._pressedKeys = new Set();
        document.onkeydown = (event) => {
            this._pressedKeys.add(event.key.toLowerCase());
            if (this.shouldOpen(event)) {
                this.show();
                this._terminal.refreshText();
            }
        };
        this._terminal.onClose = () => {
            this.close();
        };
    }
    shouldOpen(event) {
        return event.ctrlKey && event.key === 'y';
    }
}
