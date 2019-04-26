"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("elements/lib/element");
class BreadCrumbs extends element_1.CustomElement {
    constructor() {
        super();
        this.startCharacter = '|';
        this.delimiter = '>';
        this.ul = document.createElement('ul');
    }
    updateAttributes(attributes) {
    }
    get css() {
        // language=CSS
        return super.css + `
      :host {
        --breadcrumb-color: #5d91e5;
        --delimiter-color: #5c6873;
      }

      ul {
        margin: 0;
        padding: 0;
        list-style: none;
        height: 26px;
      }

      /* Display list items side by side */
      li {
        display: inline;
        font-size: 18px;
      }

      /* Add a slash symbol (/) before/behind each list item */
      li {
        color: var(--delimiter-color);
        margin-left: 10px;
        margin-right: 10px;
      }

      /* Add a color to all links inside the list */
      a {
        color: var(--breadcrumb-color);
        text-decoration: none;
        font-weight: bold;
      }

      /* Add a color on mouse-over */
      a:hover {
        color: #01447e;
        text-decoration: underline;
      }
    `;
    }
    get crumbs() {
        if (this.shadowRoot === null) {
            return [];
        }
        return this.shadowRoot.querySelectorAll('a');
    }
    get path() {
        let crumbs = this.crumbs;
        let path = [];
        for (let a of crumbs) {
            path.push(a.innerText);
        }
        return path;
    }
    set path(value) {
        while (this.ul.firstChild) {
            this.ul.removeChild(this.ul.firstChild);
        }
        for (let i = 0; i < value.length; i++) {
            let delim = i == 0 ? this.startCharacter : this.delimiter;
            this.ul.appendChild(this.buildDelimiter(delim));
            let path = value.slice(0, i + 1);
            this.ul.appendChild(this.buildCrumb(path));
        }
    }
    render(shadowRoot) {
        super.render(shadowRoot);
        shadowRoot.appendChild(this.ul);
    }
    buildCrumb(path) {
        let li = document.createElement('li');
        let crumb = document.createElement('a');
        crumb.href = '#';
        crumb.innerText = path[path.length - 1];
        crumb.onclick = (event) => {
            event.preventDefault();
            this.path = path;
            this.dispatchEvent(new Event(BreadCrumbs.EVENT_PATH_CHANGE));
        };
        li.appendChild(crumb);
        return li;
    }
    buildDelimiter(char) {
        let delimiter = document.createElement('li');
        delimiter.innerText = char;
        return delimiter;
    }
}
/**
 * @event
 */
BreadCrumbs.EVENT_PATH_CHANGE = 'pathchange';
exports.BreadCrumbs = BreadCrumbs;
customElements.define('bread-crumbs', BreadCrumbs);