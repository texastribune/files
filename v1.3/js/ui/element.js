

class Element {
  /**
   * A class whose instances represent a DOM element. May one day be replaces with custom elements
   * via the Web Components spec (https://developer.mozilla.org/en-US/docs/Web/Web_Components).
   */
  constructor(){
    this.render();
    this._className = null;
  }

  /**
   * The HTML element tag type.
   */
  static get type(){
    return 'div';
  }

  /**
   * The HTMLElement DOM element.
   */
  get element(){
    return this._element;
  }

  get className(){
    return this._className;
  }

  get flatChildren(){
    return this.element.getElementsByTagName('*');
  }

  set className(value) {
    this.element.classList.remove(this.className);
    this.element.classList.add(value);
    this._className = value;
  }

  removeChildren(){
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
  }

  /**
   * Render the element in the DOM given its current state.
   */
  render(){
    if (!this._element){
      this._element = document.createElement(this.constructor.type);
    }
    this.removeChildren();
  }
}

/**
 * A mixin that makes the element "droppable" via the HTML drag and drop API.
 * @param {Element} elementClass - A subclass of Element.
 * @returns {Element}
 */
let DroppableMixin = (elementClass) => {
  return class extends elementClass {
    constructor(...args) {
      super(...args);

      this._dragOverClass = 'dragover';
      this._pendingActionClass = 'pending-action';

      this._counterSet = new Set();

      // Update the dragover counter if a child is removed.
      let mutationObserver = new MutationObserver((mutationList) => {
        for (let mutation of mutationList){
          if (mutation.removedNodes.length > 0) {
            this.handleChildrenRemove(mutation.removedNodes);
          }
        }
      });
      mutationObserver.observe(this.element, {childList: true, subtree: true});

      this.onDrop = null;
      this.onDragEnter = null;
      this.onDragLeave = null;

      this.dragOverActions = [];  // Actions to happen after dragover for dragOverDelay
      this.dragOverDelay = 2000;
      this._timeOuts = [];

      this.element.ondragover = this.handleDragOver.bind(this);
      this.element.ondragenter = this.handleDragEnter.bind(this);
      this.element.ondragleave = this.handleDragLeave.bind(this);
      this.element.ondrop = this.handleDrop.bind(this);
    }

    get dragOverClass(){
      return this._dragOverClass;
    }

    get isOver(){
      return this.element.classList.contains(this._dragOverClass);
    }

    set dragOverClass(value){
      if (this.isOver){
        this.element.classList.remove(this._dragOverClass);
        this.element.classList.add(value);
      }
      this._dragOverClass = value;
    }

    addDragoverAction(callback){
      this.dragOverActions.push(callback);
    }

    handleDragOver(event){
      event.preventDefault();
    }

    handleDragEnter(event){
      event.preventDefault();

      if (this._counterSet.size === 0){
        this.element.classList.add(this._dragOverClass);
        this.setTimeouts();
        if (this.onDragEnter){
          this.onDragEnter(event);
        }
      }
      this._counterSet.add(event.target);
    }

    handleDragLeave(event){
      event.preventDefault();

      this._counterSet.delete(event.target);
      if (this._counterSet.size === 0) {
        this.element.classList.remove(this._dragOverClass);
        this.clearTimeOuts();
        if (this.onDragLeave) {
          this.onDragLeave(event);
        }
      }
    }

    handleDrop(event){
      event.preventDefault();

      this._counterSet = new Set();
      this.element.classList.remove(this._dragOverClass);
      this.clearTimeOuts();
      if (this.onDrop){
        this.onDrop(event);
      }
    }

    handleChildrenRemove(removedChildren) {
      for (let child of removedChildren){
        this._counterSet.delete(child);
        for (let descendant of child.querySelectorAll("*")){
          this._counterSet.delete(descendant);
        }
      }
    }

    setTimeouts(){
      if (this.dragOverActions.length > 0){
        for (let action of this.dragOverActions){
          let timeoutId = window.setTimeout(() => {
            action();
          }, this.dragOverDelay);
          this._timeOuts.push(timeoutId);
        }
        this.element.classList.add(this._pendingActionClass);
      }
    }

    clearTimeOuts(){
      this.element.classList.remove(this._pendingActionClass);
      for (let timeout of this._timeOuts){
        window.clearTimeout(timeout);
      }
      this._timeOuts = [];
    }
  };
};

/**
 * A mixin that makes the element "draggable" via the HTML drag and drop API.
 * @param {Element} elementClass - A subclass of Element.
 * @returns {Element}
 */
let DraggableMixin = (elementClass) => {
  return class extends elementClass {
    constructor(...args) {
      super(...args);

      this._draggingClass = 'dragging';

      this.onDragStart = null;
      this.onDragEnd = null;

      this.element.draggable = true;
      this.element.ondragstart = this.handleDragStart.bind(this);
      this.element.ondragend = this.handleDragEnd.bind(this);
    }

    get draggingClass(){
      return this._draggingClass;
    }

    handleDragStart(event){
      this.element.classList.add(this.draggingClass);
      if (this.onDragStart){
        this.onDragStart(event);
      }
    }

    handleDragEnd(event){
      this.element.classList.remove(this.draggingClass);
      if (this.onDragEnd){
        this.onDragEnd(event);
      }
    }
  };
};


export {Element, DroppableMixin, DraggableMixin}
