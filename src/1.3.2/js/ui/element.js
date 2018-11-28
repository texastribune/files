

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

    this.refresh();
  }

  static create(){
      return document.createElement(this.type);
  }

  get template(){
    return `
      <div>
        <slot></slot>
      </div>
    `;
  }

  get flatChildren(){
    return this.shadowRoot.getElementsByTagName('*');
  }

  connectedCallback(){
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
   * Re-render the shadow dom.
   */
  refresh(){
    this.removeShadowChildren();
    this.render(this.shadowRoot);
  }

  /**
   * Render the shadow dom. By default adds the string returned by template to shadow dom innerHTML.
   * @param {ShadowRoot} root - The root shadow dom element.
   */
  render(root){
    root.innerHTML = this.template;
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


export {Element, DroppableMixin, DraggableMixin}
