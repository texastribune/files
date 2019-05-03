import { CustomElement } from "elements/lib/element.js";
import { createNode } from "../utils.js";
import * as icons from "./icons.js";
export class SearchBar extends CustomElement {
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
        let icon = createNode(icons.searchIcon);
        this.container.appendChild(icon);
        this.container.appendChild(this.input);
        this.shadowDOM.appendChild(this.container);
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
    updateFromAttributes(attributes) { }
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
customElements.define('search-bar', SearchBar);
