import {Element} from "./element.js";

// language=CSS
const styleText = `    
  :host {
    --dialog-header-height: 28px;
    --dialog-header-text-color: black;
    --dialog-item-text-color: #5c6873;
    --button-color: white;
    --button-hover-color: #999;
    --button-height: 30px;
    --button-min-width: 50px;
    --delete-button: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gMUEDkZeUosOwAAAtJJREFUWMPNmL9PFEEUxz+7IfzQkHCGQlBC7uzuYiWUlIaWno20a71/x9ROCxl7WmJ5JViZozwERCyIZ0ICQsFa+Nasm52ZvRXO+yab7CVv5r47853ve28CKiCKE4xW2fsrYA1YBzrAUiH8FOgBe0DXaPWxOIcLQRUiUZw8AjaA99TDW2DbaHXtIxZUIPMG2OZ+sGW02nGRCjxk9oEV7hcHRqtVGykboQZwDkzxMLgBFoxWAyehKE4AGsB3RoMF4Ft+pcKSk3TO6PBZpPE3oYJmpkZIaCqKk/08qSC3Qq7TlEpsB/gALFb8w6/Aa/Gl1HGqt4xWOwCBMJsBrhxkboG20aofxUkAHAHLHjLHQNNolUZx0gIOgUkHqcfAVSi62fKYZxvo5wi2gIFjzEBiUvndlzlcRrxhtPodEMVJ6gjsGK0OS6xhBvghX53HLTBntLouGdOW7SuF0SoIJDcdeHTwHEiLRiakzsQqspV5ViQjsgiALx79rYSSKF1YFM2EJV90DcyLXo6B+bKVkbFHFQ7DWihZ24dl4EJWpIg74KU8d5atvahwCADWgyhOTkpKCBus+rCkIJvObDgNPIK2naB54M6WsUUzoaxMY5jJwxru2pBjPOuImZWYxrCT1yH0oKhDKDO9S0fMZQXzLHfhcRP1hDjnUsWVsZlepqfLvNClhp4rmKcLvVC6Ax98pvdJHp95+rAXAt0KJUSzgun5zLMpc7nQHbvkOiHvm46eqxfFyQugn6vsQtFFmVgngbMoTv6Yp4xpuchI70YowbuOwFSKq1auPvKZXmaeWf2TFWiundiO4mT8Sth8kb/jqIuyiXpDkMlKl56nSz7IutlikZ91Hj9H2HncGK2m811sWaP4dIS92RNgkDfTsWulbcl1YLSa9tTa/3LZMG1LvKHFoDJNrXpapDrXMatDX8eUCH1GiL2rSWQT2DVaXdW+sPpfV3q/AM0PYtQhZQVnAAAAAElFTkSuQmCC);
    --expand-button: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gYHEhUdzt4g4wAAAlJJREFUWMPtmLFr20AUxn+6Oq7imoQUCs2QvyCDh9TQJVshayBbY+rVhUIH/xnlhnbJrTGXbKVdM3XwEmgyZAhkLHhIoVDToXbT0KbLU1CPk6zIqqOhHwgZcXr+9O5J7/teQAa0Ol2s0dHvNWAd2ABWgRVn+QA4BQ6AvjX62I2RhiALkVanWwM2gT3y4Tmwa40eTyIWZCDzDNilGLSt0b00UsEEMh+BRxSLI2t0M4lUEqEl4By4y7/BBbBsjR6mEmp1ugBLwFdmg2XgczxTyvMmnTM7fJLS+DtDE2rmDPgAhMDClAQWgQbwIKmmgliGfG/TGbAl5wC4MyWhqsR75ZBqW6N7AIGkax4YeQLsAC+A3wVuUx14Bzxxrt8DRkrqpp1wc+gU/pw85U2PuViMn8A3z39tWqOpxDLhw4Js0y+gArwEHufIyiHwGrhMWbMH7FekN2WBEjJbObfqTYaeuaakUZYF60q6dlmwoURClAWryqNnbhMripLhP6EshAYl4jNQIsjLglMl7qAsOFBAv0SE+iryTWWANfo46vbbGTzXlXTtPDiU+yd5t2uBVgO+exa9BZ6Khon0UJCD0FVMelSBfY9qqAHjigi0UavTbXsk7KIEiAhdFrAzVYnrGsjx9YdRBHYPOHIWNuRJ6jmVonvUJV7DEfm9yHkEHrf6wzGIX4CTBNk5reu4sEaHcRfrM4oPZ+jN7gPDuFEsnZVOaq5Da3Toqamihg0hMMzc7SN7a41uplikvOOY5o3HMZ5CnxdiOzmJbAPvrdGj3AOr2xrp/QFWN+Jth0cnawAAAABJRU5ErkJggg==);
  }
  
  :host {
    display: flex;
    flex-direction: column;
    background: var(--browser-background);
    box-shadow: var(--browser-shadow);
    z-index: 10;
    font-family: var(--browser-font);
    font-weight: bold;
    border: 1px solid black;
  }
  
  .header {
    box-sizing: border-box;
    height: var(--dialog-header-height);
    padding-left: 4px;
    background-color: var(--focus-item-color);
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

  get template(){
    return `
      
    `;
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
    this._styleElement.innerHTML= styleText;

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
