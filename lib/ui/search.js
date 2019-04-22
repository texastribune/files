"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("elements/lib/element");
const utils_1 = require("../utils");
const icons = __importStar(require("./icons"));
class SearchBar extends element_1.CustomElement {
    constructor() {
        super();
        this.searchPending = false;
        this.input = document.createElement('input');
        this.input.placeholder = "Search";
        this.input.oninput = () => {
            // Wait TIMEOUT milliseconds to debounce and then search. Toggle searchPending.
            if (!this.searchPending) {
                this.searchPending = true;
                setTimeout(() => {
                    this.dispatchSearchEvent();
                    this.searchPending = false;
                }, SearchBar.TIMEOUT);
            }
        };
        this.input.onkeyup = (event) => {
            if (!this.searchPending && event.key === 'Enter') {
                this.dispatchSearchEvent();
            }
        };
        this.container = document.createElement('div');
        let icon = utils_1.createNode(icons.searchIcon);
        this.container.appendChild(icon);
        this.container.appendChild(this.input);
    }
    get css() {
        // language=CSS
        return super.css + `
        svg {
          display: inline-block;
          width: var(--search-icon-size, 22px);
          height: var(--search-icon-size, 22px);
          vertical-align: middle;
          margin: 5px;
          fill: var(--search-icon-color, black);
        }
      
      input {
          height: var(--search-height, 22px);
          padding-left: 5px;
          margin-left: 4px;
          border-radius: 4px;
          border: none;
      }
    `;
    }
    updateAttributes(attributes) {
    }
    render(shadowRoot) {
        super.render(shadowRoot);
        shadowRoot.appendChild(this.container);
    }
    dispatchSearchEvent() {
        let event = new Event(SearchBar.EVENT_SEARCH_CHANGE);
        this.dispatchEvent(event);
    }
    get value() {
        return this.input.value;
    }
}
/**
 * @event
 */
SearchBar.EVENT_SEARCH_CHANGE = "search";
/**
 * milliseconds between search events for debounce purposes
 */
SearchBar.TIMEOUT = 500;
exports.SearchBar = SearchBar;
customElements.define('search-bar', SearchBar);
