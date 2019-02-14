"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("elements/lib/element");
const draggable_1 = require("elements/lib/draggable");
/**
 * An element that represents the current location in a hierarchy.
 */
class BreadCrumb extends element_1.CustomElement {
    constructor(name, path) {
        super();
        this.name = name;
        this.path = path;
        this._link = null;
        this.className = 'crumb';
        // Callbacks
        this.onClick = null;
    }
    static get type() {
        return 'li';
    }
    get name() {
        return this._name || '';
    }
    get path() {
        return this._path || [];
    }
    set name(value) {
        this._name = value;
        this._link.innerText = this._name;
    }
    set path(value) {
        this._path = value;
    }
    render() {
        super.render();
        this._link = document.createElement('a');
        this._link.href = '#';
        this._link.onclick = (event) => {
            event.preventDefault();
            if (this.onClick) {
                this.onClick(this.path);
            }
        };
        this._link.innerText = this.name;
        this.element.appendChild(this._link);
    }
}
const DroppableBreadCrumb = draggable_1.DroppableMixin(BreadCrumb);
class History extends element_1.CustomElement {
    constructor() {
        super();
        // Set defaults
        this.startCharacter = '|';
        this.delimiter = '>';
        this.onDragOver = null;
        this.className = 'crumbs';
        this.delimiterClassName = 'delimiter';
        // Event callbacks
        this.onClick = null;
    }
    static get type() {
        return 'ul';
    }
    get path() {
        return this._path || [];
    }
    set delimiter(value) {
        this._delimiter = value;
        this.render();
    }
    set path(value) {
        this._path = value;
        this.render();
    }
    set startCharacter(value) {
        this._startCharacter = value;
        this.render();
    }
    render() {
        super.render();
        this.element.appendChild(this.buildDelimiter(this._startCharacter));
        for (let i = 0; i < this.path.length; i++) {
            let path = this.path.slice(0, i + 1);
            let name = this.path[i];
            if (i !== 0) {
                this.element.appendChild(this.buildDelimiter(this._delimiter));
            }
            this.element.appendChild(this.buildCrumb(name, path));
        }
    }
    buildCrumb(name, path) {
        let crumb = new BreadCrumb(name, path);
        crumb.addDragoverAction(() => {
            if (this.onDragOver) {
                this.onDragOver(crumb.path);
            }
        });
        crumb.onClick = (path) => {
            if (this.onClick) {
                this.onClick(path);
            }
        };
        return crumb.element;
    }
    buildDelimiter(text) {
        let delimiter = document.createElement('li');
        delimiter.className = this.delimiterClassName;
        delimiter.innerText = text;
        return delimiter;
    }
    push(name) {
        this._path.push(name);
        this.path = this._path;
    }
    pop() {
        let segment = this._path.pop();
        if (segment) {
            this.path = this._path;
        }
        return segment; // url;
    }
}
exports.default = History;
customElements.define('bread-crumb', DroppableBreadCrumb);
customElements.define('bread-crumbs', History);
