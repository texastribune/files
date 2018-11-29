import {Element} from "./element.js";

// language=CSS
const styleText = `    
  :host {
    display: flex;
    flex-direction: column;
    background: var(--dialog-background);
    box-shadow: var(--dialog-shadow);
    z-index: 10;
    font-family: var(--dialog-font);
    font-weight: bold;
    border: 1px solid black;
  }
  
  .header {
    box-sizing: border-box;
    height: var(--dialog-header-height);
    padding-left: 4px;
    background-color: var(--dialog-header-background-color);
    color: var(--dialog-header-text-color);
    cursor: move;
  }
  
  .header > .name {
    line-height: var(--dialog-header-height);
    margin-left: 4px;
    font-size: 14px;
  }
  
  .header > .dialog-button {
    width: var(--dialog-header-height);
    height: var(--dialog-header-height);
  }
  
  ::slotted(.dialog-item) {
    display: block;
    padding: 12px;
    cursor: pointer;
    color: var(--dialog-item-text-color);
  }

  ::slotted(.dialog-item input[type="checkbox"]) {
    float: right;
  }

  ::slotted(.dialog-item.drag-element) {
    position: absolute;
    padding: 0;
    margin: 0;
    width: 15px;
    height: 15px;
    top: 0;
    left: 0;
    cursor: move;
    font-size: 15px;
    line-height: 15px;
    text-align: center;
  }
  
  
  /* Should be the same as .file-browser-container .button */
  ::slotted(.button) {
    position: relative;
    box-sizing: border-box;
    text-align: center;
    min-width: var(--button-min-width);
    padding: 0 5px;
    overflow: hidden;
    text-transform: uppercase;
    border-radius: 4px;
    outline-color: #ccc;
    background-color: var(--button-color);
    line-height: var(--button-height);
    height: var(--button-height);
  
    float: right;
    margin: 10px;
  }
  
  /* Should be the same as .file-browser-container .button:hover */
  ::slotted(.button:hover) {
    cursor: pointer;
    background-color: var(--button-hover-color);
  }
  
  .dialog-button {
    display: inline-block;
    float: right;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  .dialog-button.expand::after {
    display: inline-block;
    width: 100%;
    height: 100%;
    background-size: 18px 18px;
    background-image: var(--expand-button);
    background-repeat: no-repeat;
    background-position: center;
    content: "";
  }
  
  .dialog-button.delete::after {
    display: inline-block;
    width: 100%;
    height: 100%;
    background-size: 18px 18px;
    background-image: var(--delete-button);
    background-repeat: no-repeat;
    background-position: center;
    content: "";
  }
`;

export class Dialog extends Element {
  constructor(parent){
    super();

    // Parent is a dialog instance. This dialog will close when parent closes.
    // It won't close when parent is clicked.
    this.parent = parent || null;
    this.name = "";
    this._children = new Set();

    this._itemClass = 'dialog-item';
    this._position = null;
    this._fullScreen = false;

    this.style.position = 'absolute';
    this.display = 'none';

    // Event callbacks
    this.onShow = null;
    this.onClose = null;
    this.onRemove = null;

    // Listener to close dialog when clicked outside. Checks if click is in
    // dialog or one of one of its child dialogs and if not closes.
    this._clickListener = (event) => {
      if (!event.defaultPrevented){
        let targets;
        if (event.path){
          // Only supported by Chrome as of 2/18
          targets = new Set(event.path);
        } else {
          targets = new Set();
          let target = event.target;
          while (target) {
            targets.add(target);
            target = target.parentElement;
          }
        }

        let isThis = targets.has(this);
        let isChild = false;
        for (let child of this.flatChildDialogs){
          if (targets.has(child)){
            isChild = true;
          }
        }

        if (!(isThis || isChild)){
          this.close();
        }
      }
    };

    this.center();
    this.items = [];
  }

  get childDialogs(){
    return this._children;
  }

  get flatChildDialogs(){
      let childSet = new Set();
      for (let child of this.childDialogs){
          childSet.add(child);
          for (let flatChildren of child.flatChildDialogs){
              childSet.add(flatChildren);
          }
      }
      return childSet;
  }

  static get CSS(){
    return styleText;
  }

  set name(value){
    this._nameElement.innerText = value;
  }

  set items(elements){
    this.removeChildren();
    for (let element of elements){
      element.classList.add(this._itemClass);
    }
    this.appendChildren(elements);
  }

  set parent(value){
    if (value === null){
      if (this._parent){
        this._parent.childDialogs.remove(this);
      }
      this._parent = null;
    } else {
      if (!parent instanceof Dialog){
        throw TypeError("Parent of Dialog must be a Dialog instance.")
      }
      value.childDialogs.add(this);
    }
  }

  render(root){
    this._styleElement = document.createElement('style');
    this._styleElement.type = 'text/css';
    this._styleElement.innerHTML= this.constructor.CSS;

    this._headerElement = document.createElement('div');
    this._headerElement.className = 'header';
    this._nameElement = document.createElement('span');
    this._nameElement.className = 'name';
    let expandButton = document.createElement('div');
    expandButton.className = 'dialog-button expand';
    expandButton.onmousedown =(event) => {
      // Prevent from moving dialog.
      event.stopPropagation();
      event.preventDefault();
    };
    expandButton.onclick = (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (this._fullScreen){
        this.center();
      } else {
        this.expand();
      }
    };
    let deleteButton = document.createElement('div');
    deleteButton.className = 'dialog-button delete';
    deleteButton.onmousedown =(event) => {
      // Prevent from moving dialog.
      event.stopPropagation();
      event.preventDefault();
    };
    deleteButton.onclick = (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.close();
    };
    this._headerElement.appendChild(this._nameElement);
    this._headerElement.appendChild(deleteButton);
    this._headerElement.appendChild(expandButton);
    this._headerElement.onmousedown = (event) => {
      event.preventDefault();

      this.startDrag();
    };

    this._itemElement = document.createElement('div');
    this._itemElement.className = 'items';
    let slot = document.createElement('slot');
    slot.innerHTML= '<span>SLOT</span>';
    this._itemElement.appendChild(slot);

    root.appendChild(this._styleElement);
    root.appendChild(this._headerElement);
    root.appendChild(this._itemElement);
  }

  show(){
    if (this.onShow){
      this.onShow(this);
    }
    this.style.display = 'block';
    document.addEventListener('click', this._clickListener);
  }

  close(){
    for (let child of this._children) {
      child.close();
    }

    if (this.onClose){
      this.onClose(this);
    }
    this.style.display = 'none';
    document.removeEventListener('click', this._clickListener);
  }

  remove(){
    for (let child of this._children) {
      child.remove();
    }

    if (this.onRemove){
      this.onRemove(this);
    }
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
    document.removeEventListener('click', this._clickListener);
  }

  move(positionX, positionY){
    this.style.position = 'absolute';
    this.style.top = `${positionY}px`;
    this.style.left = `${positionX}px`;
    this.style.transform = null;
    this._position = [positionX, positionY];
    this._fullScreen = false;
  }

  center(){
    this.style.position = 'fixed';
    this.style.top = '50%';
    this.style.left = '50%';
    this.style.width = null;
    this.style.height = null;
    this.style.transform = 'translate(-50%, -50%)';
    let rect = this.getBoundingClientRect();
    let scrollLeft = document.documentElement.scrollLeft;
    let scrollTop = document.documentElement.scrollTop;
    this._position = [rect.left + scrollLeft, rect.bottom + scrollTop];
    this._fullScreen = false;
  }

  expand(){
    this.style.position = 'fixed';
    this.style.transform = null;
    this.style.top = '0%';
    this.style.left = '0%';
    this.style.width = '100%';
    this.style.height = '100%';
    this._fullScreen = true;
  }

  startDrag() {
    document.onmousemove = (event) => {
      let scrollLeft = document.documentElement.scrollLeft;
      let scrollTop = document.documentElement.scrollTop;
      this.move(scrollLeft + event.clientX, scrollTop + event.clientY);
    };
    document.onmouseup = this.stopDrag.bind(this);
  }

  stopDrag() {
    document.onmousemove = null;
    document.onmouseup = null;
  }
}

export class ConfirmDialog extends Dialog {
  constructor(parent){
    super(parent);

    this.onConfirmed = null;
  }

  render(root) {
    super.render(root);
    this._confirmButton = document.createElement('div');
    this._confirmButton.innerText = "Yes";
    this._confirmButton.onclick = this._onConfirmed.bind(this);
    this._confirmButton.className = 'button';
    root.appendChild(this._confirmButton);
  }

  set confirmationText(value){
    this._confirmButton.innerText = value;
  }

  set disabled(value){
    this._confirmButton.disabled = value;
  }

  _onConfirmed(event){
    this.close();
    if (this.onConfirmed){
      this.onConfirmed(event);
    }
  }
}


customElements.define('base-dialog', Dialog);
customElements.define('confirm-dialog', ConfirmDialog);
