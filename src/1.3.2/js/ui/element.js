

class Element extends HTMLElement {
  /**
   * A class whose instances represent a DOM element. May one day be replaces with custom elements
   * via the Web Components spec (https://developer.mozilla.org/en-US/docs/Web/Web_Components).
   */
  constructor(){
    super();

    if (this.shadowRoot === null){
      this.attachShadow({mode: 'open'});
    }

    for (let attr of this.constructor.observedAttributes){
      let value = this.getAttribute(attr);
      if (value !== null) {
        this[attr] = value;
      }
    }

    this.refresh();
  }

  static get observedAttributes() {
    return [];
  }

  static create(){
      return document.createElement(this.type);
  }

  get css(){
    return null;
  }

  get template(){
    return null;
  }

  connectedCallback(){

  }

  attributeChangedCallback(name, oldValue, newValue) {
      this[name] = newValue;
      this.refresh();
  }

  /**
   * Remove every child element from shadow dom
   */
  removeShadowChildren(){
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }
  }

  /**
   * Remove every child element
   */
  removeChildren(){
    while (this.firstChild) {
        this.removeChild(this.firstChild);
    }
  }

  /**
   * Add child to the shadow dom
   * @param {Node} element
   */
  appendShadowChild(element){
    this.shadowRoot.appendChild(frag);
  }

  /**
   * Add children in bulk to the shadow dom
   * @param {NodeList} elements
   */
  appendShadowChildren(elements){
    let frag = document.createDocumentFragment();
    for (let element of elements){
        frag.appendChild(element);
    }
    this.shadowRoot.appendChild(frag);
  }

  /**
   * Add children in bulk to this element
   * @param {NodeList} elements
   */
  appendChildren(elements){
    let frag = document.createDocumentFragment();
    for (let element of elements){
        frag.appendChild(element);
    }
    this.shadowRoot.appendChild(frag);
  }

  /**
   * All descendents recursively. Optionally filtered by type.
   * @param {type} [type] - Filter by element class
   * @returns HTMLElement[]
   */
  flatChildren(type){
    function allChildren(element){
      let rows = [];
      for (let child of element.children){
        if (type === undefined || child instanceof type){
          rows.push(child);
        }
        rows = rows.concat(allChildren(child));
      }
      return rows;
    }
    return allChildren(this);
  }

  /**
   * Re-render the shadow dom.
   */
  refresh(){
    this.removeShadowChildren();
    this.render(this.shadowRoot);
  }

  /**
   * Render the shadow dom. By default adds the string returned by template to shadow dom innerHTML.
   * @param {ShadowRoot} shadowRoot - The root shadow dom element.
   */
  render(shadowRoot){
    let css = this.css;
    if (css) {
        let styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.innerHTML= css.toString();
        shadowRoot.appendChild(styleElement);
    }

    let template = this.template;
    if (template) {
      if (!(template instanceof HTMLTemplateElement)){
        let t = document.createElement('template');
        t.innerHTML = template.toString();
        template = t;
      }
      let clone = document.importNode(template.content, true);
      shadowRoot.appendChild(clone);
    }
  }
}

/**
 * A mixin that makes the element "droppable" via the HTML drag and drop API.
 * @mixin DroppableMixin
 * @param {HTMLElement} elementClass - A subclass of Element.
 * @returns {HTMLElement}
 */
let DroppableMixin = (elementClass) => {
  return class extends elementClass {
    constructor(...args) {
      super(...args);


      this.dragOverActions = [];  // Actions to happen after dragover for dragOverDelay
      this.dragOverDelay = 2000;
      this._timeOuts = [];

      this.addEventListener("dragover", this.handleDragOver.bind(this));
      this.addEventListener("dragenter", this.handleDragEnter.bind(this));
      this.addEventListener("dragleave", this.handleDragLeave.bind(this));
      this.addEventListener("drop", this.handleDrop.bind(this));
    }

    static get dragOverClass(){
      return 'dragover';
    }

    static get pendingActionClass(){
      return 'pending-action';
    }

    get isOver(){
      return this.classList.contains(this.constructor.dragOverClass);
    }

    /**
     * Add callback to be called when dragover starts after the dragover delay.
     * @memberof DroppableMixin#
     * @param {Function} callback
     */
    addDragoverAction(callback){
      this.dragOverActions.push(callback);
    }

    /**
     * Called when dragover event is triggered.
     * @memberof DroppableMixin#
     * @param {Event} event
     */
    handleDragOver(event){
      event.preventDefault();
    }

    /**
     * Called when dragenter event triggered.
     * @memberof DroppableMixin#
     * @param {Event} event
     */
    handleDragEnter(event){
      event.preventDefault();

      this.classList.add(this.constructor.dragOverClass);
      this.setTimeouts();
    }

    /**
     * Called when dragleave event triggered.
     * @memberof DroppableMixin#
     * @param {Event} event
     */
    handleDragLeave(event){
      event.preventDefault();

      this.classList.remove(this.constructor.dragOverClass);
      this.clearTimeOuts();
    }

    /**
     * Called when drop event triggered.
     * @memberof DroppableMixin#
     * @param {Event} event
     */
    handleDrop(event){
      event.preventDefault();

      this.classList.remove(this.constructor.dragOverClass);
      this.clearTimeOuts();
    }

    /**
     * Set timeouts to call dragover actions.
     * @memberof DroppableMixin#
     */
    setTimeouts(){
      if (this.dragOverActions.length > 0){
        for (let action of this.dragOverActions){
          let timeoutId = window.setTimeout(() => {
            action();
          }, this.dragOverDelay);
          this._timeOuts.push(timeoutId);
        }
        this.classList.add(this.constructor.pendingActionClass);
      }
    }

    /**
     * Remove timeouts to call dragover actions.
     * @memberof DroppableMixin#
     */
    clearTimeOuts(){
      this.classList.remove(this.constructor.pendingActionClass);
      for (let timeout of this._timeOuts){
        window.clearTimeout(timeout);
      }
      this._timeOuts = [];
    }
  };
};

/**
 * A mixin that makes the element "draggable" via the HTML drag and drop API.
 * @mixin DraggableMixin
 * @param {HTMLElement} elementClass - A subclass of Element.
 * @returns {HTMLElement}
 */
let DraggableMixin = (elementClass) => {
  return class extends elementClass {
    constructor(...args) {
      super(...args);

      this.draggable = true;
      this.addEventListener('dragstart', this.handleDragStart.bind(this));
      this.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    /**
     * The class name of the element when it is being dragged.
     * @memberof DraggableMixin#
     */
    static get draggingClass(){
      return 'dragging';
    }

    /**
     * Called when dragstart event is fired.
     * @param {Event} event
     * @memberof DraggableMixin#
     */
    handleDragStart(event){
      this.classList.add(this.constructor.draggingClass);
    }

    /**
     * Called when dragend event is fired.
     * @param {Event} event
     * @memberof DraggableMixin#
     */
    handleDragEnd(event){
      this.classList.remove(this.constructor.draggingClass);
    }
  };
};

export class ScrollWindowElement extends Element {
  constructor(){
    super();

    this._speed = 1;

    this.onwheel = (event) => {
      this.scrollPosition -= event.deltaY * this.speed;
    };
  }

  static get observedAttributes() {
    return ['speed'];
  }

  get scrollPosition(){
    return Number.parseInt(this.pane.style.top);
  }

  set scrollPosition(value){
    let paneMaxOffset = this.view.getBoundingClientRect().height - this.pane.getBoundingClientRect().height;
    this.pane.style.top = Math.min(
        0,
        Math.max(paneMaxOffset, Number.parseInt(value))
    ).toString();
  }

  get speed(){
    return this._speed;
  }

  set speed(value){
    this._speed = Number.parseInt(value);
  }

  render(shadowRoot) {
    super.render(shadowRoot);

    this.view = document.createElement('div');
    this.view.style.position = 'relative';
    this.view.style.overflowY = 'hidden';
    this.view.style.height = 'inherit';
    this.view.style.width = '100%';

    this.pane = document.createElement('div');
    this.pane.style.position = 'absolute';
    this.pane.style.top = '0';
    this.pane.style.width = '100%';

    let slot = document.createElement('slot');

    this.pane.appendChild(slot);
    this.view.appendChild(this.pane);
    shadowRoot.appendChild(this.view);
  }
}


export {Element, DroppableMixin, DraggableMixin}
