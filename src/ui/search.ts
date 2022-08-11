import {CustomElement} from "./elements/element.js";
import {createNode} from "../utils.js";
import * as icons from "./icons.js";


export class SearchBar extends CustomElement {
  private readonly input : HTMLInputElement;
  private readonly container : HTMLDivElement;
  private timeout : NodeJS.Timeout | null = null;

  static debounceAttribute = "debounce";

  /**
   * @event
   */
  static EVENT_SEARCH_CHANGE = "search";

  /**
   * milliseconds between search events for debounce purposes
   */
  static DEFAULT_DEBOUNCE = 500;

  constructor(){
    super();

    this.input = document.createElement('input');
    this.input.placeholder = "Search";
    this.input.oninput = () => {
      // Wait debounce attribute value in milliseconds to debounce and then search. Toggle searchPending.
      let debounce = this.debounce;
      if (debounce === null) {
        debounce = SearchBar.DEFAULT_DEBOUNCE;
      }

      if (this.timeout !== null){
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.dispatchSearchEvent();
        this.timeout = null;
      }, debounce);
    };
    this.input.onkeyup = (event) => {
      if (event.key === 'Enter') {
        if (this.timeout !== null){
          clearTimeout(this.timeout);
          this.timeout = null;
        }

        this.dispatchSearchEvent();
      }
    };
    this.container = document.createElement('div');
    let icon = createNode(icons.searchIcon);
    this.container.appendChild(icon);
    this.container.appendChild(this.input);

    this.shadowDOM.appendChild(this.container);
  }

  get css(): string {
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
    `
  }

  static get observedAttributes() {
    return [SearchBar.debounceAttribute,];
  }

  updateFromAttributes(attributes: { [p: string]: string | null }): void {}

  private dispatchSearchEvent(){
    let event = new Event(SearchBar.EVENT_SEARCH_CHANGE);
    this.dispatchEvent(event);
  }

  get value() : string {
    return this.input.value;
  }

  get debounce(): number | null {
    let stringValue = this.getAttribute(SearchBar.debounceAttribute);
    if (stringValue === null){
      return null;
    }

    return Number.parseInt(stringValue);
  }

  set debounce(value: number | null) {
    if (value === null) {
      this.removeAttribute(SearchBar.debounceAttribute);
    } else {
      this.setAttribute(SearchBar.debounceAttribute, value.toString());
    }
  }
}

customElements.define('search-bar', SearchBar);