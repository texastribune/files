
export interface HTMLElementWithCallbacks extends HTMLElement {
  connectedCallback() : void
  disconnectedCallback() : void
}

/**
 * Basic element class with some utilities to help extend HTMLElement. Add all persitant elements
 * to the shadowDOM in the constructor. Update state from attributes in updateFromAttributes.
 */
export abstract class CustomElement extends HTMLElement implements HTMLElementWithCallbacks {
  readonly shadowDOM: ShadowRoot;
  protected htmlElement: HTMLDivElement | null;
  protected readonly styleElement: HTMLStyleElement;
  private needsRefresh: boolean = true;

  protected constructor() {
    super();

    this.styleElement = document.createElement('style');
    this.styleElement.type = 'text/css';
    this.htmlElement = null;

    this.shadowDOM = this.attachShadow({mode: 'open'});

    this.shadowDOM.appendChild(this.styleElement);
  }

  static get observedAttributes(): string[] {
    return [];
  }

  get css(): string {
    return "";
  }

  get html(): string {
    return "";
  }

  connectedCallback() {
    if (this.needsRefresh) {
      this.refresh();
    }
  }

  disconnectedCallback() {
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: any) {
    this.needsRefresh = true;
    if (this.isConnected) {
      this.refresh();
    }
  }

  /**
   * Remove every child element from shadow dom
   */
  removeShadowChildren() {
    while (this.shadowDOM.firstChild) {
      this.shadowDOM.removeChild(this.shadowDOM.firstChild);
    }
  }

  /**
   * Remove every child element
   */
  removeChildren(type?: any) {
    if (type !== undefined) {
      let children = Array.from(this.children);
      for (let child of children) {
        if (child instanceof type) {
          this.removeChild(child);
        }
      }
    } else {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
    }
  }

  /**
   * Add child to the shadow dom
   */
  appendShadowChild(element: Element) {
    this.shadowDOM.appendChild(element);
  }

  /**
   * Add children in bulk to the shadow dom
   */
  appendShadowChildren(elements: Element[] | NodeList) {
    let frag = document.createDocumentFragment();
    for (let element of elements) {
      frag.appendChild(element);
    }
    this.shadowDOM.appendChild(frag);
  }

  /**
   * Add children in bulk to this element
   */
  appendChildren(elements: Element[] | NodeList) {
    let frag = document.createDocumentFragment();
    for (let element of elements) {
      frag.appendChild(element);
    }
    this.appendChild(frag);
  }

  /**
   * All descendents recursively. Optionally filtered by type.
   */
  flatChildren<T extends Element>(type?: new () => T) {
    function allChildren(element: Element): T[] {
      let rows: T[] = [];
      for (let child of element.children) {
        if (type === undefined || child instanceof type) {
          rows.push(child as T);
        }
        rows = rows.concat(allChildren(child));
      }
      return rows;
    }

    return allChildren(this);
  }

  /**
   * Gets all current attributes and values and calls render.
   */
  refresh() {
    let attributes: { [name: string]: string | null } = {};
    for (let attr of (this.constructor as typeof CustomElement).observedAttributes) {
      attributes[attr] = this.getAttribute(attr);
    }

    this.render(attributes);

    this.needsRefresh = false;
  }

  /**
   * Updates state and renders the shadow dom. By default adds the string returned by template to the innerHTML
   * of a div in the shadow dom and the css to a style element in the shadow dom.
   * @param attributes - The current attributes and their values defined on the html element.
   */
  render(attributes: { [name: string]: string | null }) {
    this.updateFromAttributes(attributes);

    let css = this.css;
    if (css !== "") {
      this.styleElement.textContent = css;
    }

    let template = this.html;
    if (template) {
      if (this.htmlElement === null) {
        this.htmlElement = document.createElement('div');
        this.shadowDOM.appendChild(this.htmlElement);
      }
      this.htmlElement.innerHTML = template;
    }
  }

  /**
   * Updates the state of this element and any DOM updates. Called when any updates are made to the
   * observed attributes of this element. All important state should be stored via the attributes,
   * so all updates should be made here.
   */
  abstract updateFromAttributes(attributes: { [name: string]: string | null }): void;
}
