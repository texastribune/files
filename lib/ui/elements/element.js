/**
 * Basic element class with some utilities to help extend HTMLElement. Add all persitant elements
 * to the shadowDOM in the constructor. Update state from attributes in updateFromAttributes.
 */
export class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.needsRefresh = true;
        this.styleElement = document.createElement('style');
        this.styleElement.type = 'text/css';
        this.htmlElement = null;
        this.shadowDOM = this.attachShadow({ mode: 'open' });
        this.shadowDOM.appendChild(this.styleElement);
    }
    static get observedAttributes() {
        return [];
    }
    get css() {
        return "";
    }
    get html() {
        return "";
    }
    connectedCallback() {
        if (this.needsRefresh) {
            this.refresh();
        }
    }
    disconnectedCallback() {
    }
    attributeChangedCallback(name, oldValue, newValue) {
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
    removeChildren(type) {
        if (type !== undefined) {
            let children = Array.from(this.children);
            for (let child of children) {
                if (child instanceof type) {
                    this.removeChild(child);
                }
            }
        }
        else {
            while (this.firstChild) {
                this.removeChild(this.firstChild);
            }
        }
    }
    /**
     * Add child to the shadow dom
     */
    appendShadowChild(element) {
        this.shadowDOM.appendChild(element);
    }
    /**
     * Add children in bulk to the shadow dom
     */
    appendShadowChildren(elements) {
        let frag = document.createDocumentFragment();
        for (let element of elements) {
            frag.appendChild(element);
        }
        this.shadowDOM.appendChild(frag);
    }
    /**
     * Add children in bulk to this element
     */
    appendChildren(elements) {
        let frag = document.createDocumentFragment();
        for (let element of elements) {
            frag.appendChild(element);
        }
        this.appendChild(frag);
    }
    /**
     * All descendents recursively. Optionally filtered by type.
     */
    flatChildren(type) {
        function allChildren(element) {
            let rows = [];
            for (let child of element.children) {
                if (type === undefined || child instanceof type) {
                    rows.push(child);
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
        let attributes = {};
        for (let attr of this.constructor.observedAttributes) {
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
    render(attributes) {
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
}
