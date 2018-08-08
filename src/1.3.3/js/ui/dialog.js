import {Element} from "./element.js";


export class Dialog extends Element {
  constructor(parent){
    super();

    // Parent is a dialog instance. This dialog will close when parent closes.
    // It won't close when parent is clicked.
    this.parent = parent || null;
    this.name = "";
    this._children = new Set();
    this._body = document.getElementsByTagName('body')[0];
    this._body.appendChild(this.element);
    this.className = 'dialog';
    this._itemClass = 'dialog-item';
    this._position = null;
    this._fullScreen = false;

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

        let isThis = targets.has(this._element);
        let isChild = false;
        for (let child of this.flatChildren){
          if (targets.has(child._element)){
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

  get children(){
    return this._children;
  }

  get flatChildren(){
    let childSet = new Set();
    for (let child of this._children){
      childSet.add(child);
      for (let flatChildren of child.flatChildren){
        childSet.add(flatChildren);
      }
    }
    return childSet;
  }

  set name(value){
    this._nameElement.innerText = value;
  }

  set items(elements){
    while (this._itemElement.firstChild) {
      this._itemElement.removeChild(this._itemElement.firstChild);
    }

    let frag = document.createDocumentFragment();
    for (let element of elements){
      element.classList.add(this._itemClass);
      frag.appendChild(element);
    }
    this._itemElement.appendChild(frag);
  }

  set parent(value){
    if (value === null){
      if (this._parent){
        this._parent.children.remove(this);
      }
      this._parent = null;
    } else {
      if (!parent instanceof Dialog){
        throw TypeError("Parent of Dialog must be a Dialog instance.")
      }
      value.children.add(this);
    }
  }

  render(){
    super.render();
    this._element.style.position = 'absolute';
    this._element.style.display = 'none';

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

    this._element.appendChild(this._headerElement);
    this._element.appendChild(this._itemElement);
  }

  show(){
    if (this.onShow){
      this.onShow(this);
    }
    this._element.style.display = 'block';
    document.addEventListener('click', this._clickListener);
  }

  close(){
    for (let child of this._children) {
      child.close();
    }

    if (this.onClose){
      this.onClose(this);
    }
    this._element.style.display = 'none';
    document.removeEventListener('click', this._clickListener);
  }

  remove(){
    for (let child of this._children) {
      child.remove();
    }

    if (this.onRemove){
      this.onRemove(this);
    }
    if (this._element.parentElement) {
      this._element.parentElement.removeChild(this._element);
    }
    document.removeEventListener('click', this._clickListener);
  }

  move(positionX, positionY){
    this._element.style.position = 'absolute';
    this._element.style.top = `${positionY}px`;
    this._element.style.left = `${positionX}px`;
    this._element.style.transform = null;
    this._position = [positionX, positionY];
    this._fullScreen = false;
  }

  center(){
    this._element.style.position = 'fixed';
    this._element.style.top = '50%';
    this._element.style.left = '50%';
    this._element.style.width = null;
    this._element.style.height = null;
    this._element.style.transform = 'translate(-50%, -50%)';
    let rect = this._element.getBoundingClientRect();
    let scrollLeft = document.documentElement.scrollLeft;
    let scrollTop = document.documentElement.scrollTop;
    this._position = [rect.left + scrollLeft, rect.bottom + scrollTop];
    this._fullScreen = false;
  }

  expand(){
    this._element.style.position = 'fixed';
    this._element.style.transform = null;
    this._element.style.top = '0%';
    this._element.style.left = '0%';
    this._element.style.width = '100%';
    this._element.style.height = '100%';
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
    this._confirmButton = document.createElement('div');
    this._confirmButton.innerText = "Yes";
    this._confirmButton.onclick = this._onConfirmed.bind(this);
    this._confirmButton.className = 'button';
    this.element.appendChild(this._confirmButton);
    this.onConfirmed = null;
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
