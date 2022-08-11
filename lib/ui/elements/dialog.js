import { Grabbable } from "./movable";
/**
 * A movable dialog element
 * CSS variables for theming:
 *    --dialog-header-height
 *    --dialog-header-background-color
 *    --dialog-header-text-color
 *    --dialog-background
 *    --dialog-font
 */
export class Dialog extends Grabbable {
    constructor() {
        super();
        // Event callbacks
        this.onShow = null;
        this.onClose = null;
        this.onRemove = null;
        this.noPropagate = true; // Don't let clicks effect other dialogs.
        this.opened = false;
        // Parent is a dialog instance. This dialog will close when parent closes.
        // It won't close when parent is clicked.
        this.nameElement = document.createElement('span');
        this.nameElement.id = Dialog.nameId;
        this.headerElement = document.createElement('div');
        this.headerElement.id = Dialog.headerId;
        this.containerElement = document.createElement('div');
        this.containerElement.id = Dialog.containerId;
        const preventMovement = (event) => {
            event.stopPropagation();
            event.preventDefault();
        };
        let expandButton = document.createElement('button');
        expandButton.type = 'button';
        expandButton.id = Dialog.expandButtonId;
        const toggleExpand = (event) => {
            preventMovement(event);
            this.expanded = !this.expanded;
        };
        expandButton.onmousedown = preventMovement;
        expandButton.ontouchstart = preventMovement;
        expandButton.onclick = toggleExpand;
        expandButton.ontouchend = toggleExpand;
        let deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.id = Dialog.deleteButtonId;
        const hideDialog = (event) => {
            preventMovement(event);
            this.visible = false;
        };
        deleteButton.onmousedown = preventMovement;
        deleteButton.ontouchstart = preventMovement;
        deleteButton.onclick = hideDialog;
        deleteButton.ontouchend = hideDialog;
        this.headerElement.appendChild(this.nameElement);
        this.headerElement.appendChild(deleteButton);
        this.headerElement.appendChild(expandButton);
        let slot = document.createElement('slot');
        this.containerElement.appendChild(slot);
        this.documentClickListener = (event) => {
            this.closeOnOutsideClick(event);
        };
        this.shadowDOM.appendChild(this.headerElement);
        this.shadowDOM.appendChild(this.containerElement);
    }
    static get observedAttributes() {
        return [Dialog.nameAttribute, Dialog.visibleAttribute, Dialog.expandedAttribute];
    }
    get css() {
        // language=CSS
        return super.css + `     
      :host {
        --header-height: var(--dialog-header-height, 28px);
        --delete-button: url(${Dialog.DETETE_BUTTON_URL});
        --expand-button: url(${Dialog.EXPAND_BUTTON_URL});
      
        display: none;
        background: var(--dialog-background, #ecf2f6);
        box-shadow: var(--dialog-shadow, 2px 2px 0 0 #444);
        z-index: 10;
        font-family: var(--dialog-font, sans-serif);
        font-weight: bold;
        border: 1px solid black;
      }
      
      :host([${Dialog.visibleAttribute}]) {
        display: block;
      }
    
      :host([${Dialog.expandedAttribute}]) {
        width: 100%;
        height: 100%;
      }
      
      #${Dialog.headerId} {
        display: flex;
        box-sizing: border-box;
        height: var(--header-height);
        padding-left: 4px;
        background-color: var(--dialog-header-background-color, #c0d5e8);
        color: var(--dialog-header-text-color, black);
        white-space: nowrap;
        cursor: move;
      }
      
      #${Dialog.nameId} {
        flex: 1;
        line-height: var(--header-height);
        margin-left: 4px;
        margin-right: 4px;
        font-size: 14px;
      }
      
      #${Dialog.headerId} > button {
        float: right;
        cursor: pointer;
        border: none;
        margin: 0;
        background-color: inherit;
        padding: unset;
        width: var(--header-height);
        height: var(--header-height);
      }
      
      #${Dialog.headerId} > button::after {
        display: inline-block;
        width: 100%;
        height: 100%;
        background-size: 18px 18px;
        background-repeat: no-repeat;
        background-position: center;
        content: "";
      }
      
      #${Dialog.expandButtonId}::after {
        background-image: var(--expand-button);
      }
      
      #${Dialog.deleteButtonId}::after {
        background-image: var(--delete-button);
      }
    `;
    }
    get name() {
        return this.getAttribute(Dialog.nameAttribute) || "";
    }
    /**
     *
     * @param {string} value
     */
    set name(value) {
        this.setAttribute(Dialog.nameAttribute, value);
    }
    get visible() {
        return this.getAttribute(Dialog.visibleAttribute) !== null;
    }
    set visible(value) {
        if (value) {
            this.setAttribute(Dialog.visibleAttribute, "");
        }
        else {
            this.removeAttribute(Dialog.visibleAttribute);
        }
    }
    get expanded() {
        return this.getAttribute(Dialog.expandedAttribute) !== null;
    }
    set expanded(value) {
        if (value) {
            this.setAttribute(Dialog.expandedAttribute, "");
        }
        else {
            this.removeAttribute(Dialog.expandedAttribute);
        }
    }
    updateFromAttributes(attributes) {
        let name = attributes[Dialog.nameAttribute];
        let visible = attributes[Dialog.visibleAttribute];
        let expanded = attributes[Dialog.expandedAttribute];
        if (expanded !== null) {
            this.position = { x: 0, y: 0 };
        }
        if (name === null) {
            this.nameElement.textContent = "";
        }
        else {
            this.nameElement.textContent = name;
        }
        if (visible === null) {
            if (this.opened) {
                this.opened = false;
                let event = new Event(Dialog.EVENT_CLOSED);
                this.dispatchEvent(event);
            }
        }
        else {
            if (!this.opened) {
                this.opened = true;
                let event = new Event(Dialog.EVENT_OPENED);
                this.dispatchEvent(event);
            }
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this.style.position = 'fixed';
        // Add to documentElement because in FireFox document click listeners fire on contextmenu events
        document.documentElement.addEventListener('click', this.documentClickListener);
    }
    disconnectedCallback() {
        document.documentElement.removeEventListener('click', this.documentClickListener);
    }
    remove() {
        if (this.onRemove) {
            this.onRemove(this);
        }
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
        document.documentElement.removeEventListener('click', this.documentClickListener);
    }
    /**
     *  Checks if click is in dialog or one of one of its child dialogs and if not closes.
     */
    closeOnOutsideClick(event) {
        if (!event.defaultPrevented) {
            let targets = new Set(event.composedPath());
            if (targets.has(this)) {
                return;
            }
            for (let child of this.flatChildren(Dialog)) {
                if (targets.has(child)) {
                    return;
                }
            }
            this.visible = false;
        }
    }
    ;
}
Dialog.deleteButtonId = 'delete';
Dialog.expandButtonId = 'expand';
Dialog.nameId = 'name';
Dialog.headerId = 'header';
Dialog.containerId = 'container';
/**
 * @event
 */
Dialog.EVENT_OPENED = 'opened';
/**
 * @event
 */
Dialog.EVENT_CLOSED = 'closed';
Dialog.DETETE_BUTTON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gMUEDkZeUosOwAAAtJJREFUWMPNmL9PFEEUxz+7IfzQkHCGQlBC7uzuYiWUlIaWno20a71/x9ROCxl7WmJ5JViZozwERCyIZ0ICQsFa+Nasm52ZvRXO+yab7CVv5r47853ve28CKiCKE4xW2fsrYA1YBzrAUiH8FOgBe0DXaPWxOIcLQRUiUZw8AjaA99TDW2DbaHXtIxZUIPMG2OZ+sGW02nGRCjxk9oEV7hcHRqtVGykboQZwDkzxMLgBFoxWAyehKE4AGsB3RoMF4Ft+pcKSk3TO6PBZpPE3oYJmpkZIaCqKk/08qSC3Qq7TlEpsB/gALFb8w6/Aa/Gl1HGqt4xWOwCBMJsBrhxkboG20aofxUkAHAHLHjLHQNNolUZx0gIOgUkHqcfAVSi62fKYZxvo5wi2gIFjzEBiUvndlzlcRrxhtPodEMVJ6gjsGK0OS6xhBvghX53HLTBntLouGdOW7SuF0SoIJDcdeHTwHEiLRiakzsQqspV5ViQjsgiALx79rYSSKF1YFM2EJV90DcyLXo6B+bKVkbFHFQ7DWihZ24dl4EJWpIg74KU8d5atvahwCADWgyhOTkpKCBus+rCkIJvObDgNPIK2naB54M6WsUUzoaxMY5jJwxru2pBjPOuImZWYxrCT1yH0oKhDKDO9S0fMZQXzLHfhcRP1hDjnUsWVsZlepqfLvNClhp4rmKcLvVC6Ax98pvdJHp95+rAXAt0KJUSzgun5zLMpc7nQHbvkOiHvm46eqxfFyQugn6vsQtFFmVgngbMoTv6Yp4xpuchI70YowbuOwFSKq1auPvKZXmaeWf2TFWiundiO4mT8Sth8kb/jqIuyiXpDkMlKl56nSz7IutlikZ91Hj9H2HncGK2m811sWaP4dIS92RNgkDfTsWulbcl1YLSa9tTa/3LZMG1LvKHFoDJNrXpapDrXMatDX8eUCH1GiL2rSWQT2DVaXdW+sPpfV3q/AM0PYtQhZQVnAAAAAElFTkSuQmCC';
Dialog.EXPAND_BUTTON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gYHEhUdzt4g4wAAAlJJREFUWMPtmLFr20AUxn+6Oq7imoQUCs2QvyCDh9TQJVshayBbY+rVhUIH/xnlhnbJrTGXbKVdM3XwEmgyZAhkLHhIoVDToXbT0KbLU1CPk6zIqqOhHwgZcXr+9O5J7/teQAa0Ol2s0dHvNWAd2ABWgRVn+QA4BQ6AvjX62I2RhiALkVanWwM2gT3y4Tmwa40eTyIWZCDzDNilGLSt0b00UsEEMh+BRxSLI2t0M4lUEqEl4By4y7/BBbBsjR6mEmp1ugBLwFdmg2XgczxTyvMmnTM7fJLS+DtDE2rmDPgAhMDClAQWgQbwIKmmgliGfG/TGbAl5wC4MyWhqsR75ZBqW6N7AIGkax4YeQLsAC+A3wVuUx14Bzxxrt8DRkrqpp1wc+gU/pw85U2PuViMn8A3z39tWqOpxDLhw4Js0y+gArwEHufIyiHwGrhMWbMH7FekN2WBEjJbObfqTYaeuaakUZYF60q6dlmwoURClAWryqNnbhMripLhP6EshAYl4jNQIsjLglMl7qAsOFBAv0SE+iryTWWANfo46vbbGTzXlXTtPDiU+yd5t2uBVgO+exa9BZ6Khon0UJCD0FVMelSBfY9qqAHjigi0UavTbXsk7KIEiAhdFrAzVYnrGsjx9YdRBHYPOHIWNuRJ6jmVonvUJV7DEfm9yHkEHrf6wzGIX4CTBNk5reu4sEaHcRfrM4oPZ+jN7gPDuFEsnZVOaq5Da3Toqamihg0hMMzc7SN7a41uplikvOOY5o3HMZ5CnxdiOzmJbAPvrdGj3AOr2xrp/QFWN+Jth0cnawAAAABJRU5ErkJggg==';
Dialog.expandedAttribute = 'expanded';
Dialog.visibleAttribute = 'visible';
Dialog.nameAttribute = 'name';
export class ConfirmDialog extends Dialog {
    constructor() {
        super();
        this.confirmButton = document.createElement('button');
        this.confirmButton.id = ConfirmDialog.confirmButtonId;
        this.confirmButton.textContent = "Yes";
        this.confirmButton.onclick = this.onConfirmed.bind(this);
        this.confirmButton.ontouchend = this.onConfirmed.bind(this);
        this.confirmButton.textContent = this.confirmationText;
        this.shadowDOM.appendChild(this.confirmButton);
    }
    static get observedAttributes() {
        return Dialog.observedAttributes.concat([ConfirmDialog.confirmationTextAttribute, ConfirmDialog.disabledAttribute]);
    }
    get css() {
        // language=CSS
        return super.css + `
        #${ConfirmDialog.confirmButtonId} {
            float: right;
            margin: 2px;
            cursor: pointer;
        }
    `;
    }
    get confirmationText() {
        return this.getAttribute(ConfirmDialog.confirmationTextAttribute) || "Yes";
    }
    set confirmationText(value) {
        this.setAttribute(ConfirmDialog.confirmationTextAttribute, value);
    }
    get disabled() {
        return this.hasAttribute(ConfirmDialog.disabledAttribute);
    }
    set disabled(value) {
        if (value) {
            this.setAttribute(ConfirmDialog.disabledAttribute, "");
        }
        else {
            this.removeAttribute(ConfirmDialog.disabledAttribute);
        }
    }
    updateFromAttributes(attributes) {
        super.updateFromAttributes(attributes);
        this.confirmButton.textContent = this.confirmationText;
        this.confirmButton.disabled = this.disabled;
    }
    onConfirmed(event) {
        event.preventDefault();
        this.visible = false;
        let confirmedEvent = new Event(ConfirmDialog.EVENT_CONFIRMED);
        this.dispatchEvent(confirmedEvent);
    }
}
/**
 * @event
 */
ConfirmDialog.EVENT_CONFIRMED = 'confirmed';
ConfirmDialog.confirmButtonId = 'confirm';
ConfirmDialog.confirmationTextAttribute = 'confirmation-text';
ConfirmDialog.disabledAttribute = 'disabled';
customElements.define('base-dialog', Dialog);
customElements.define('confirm-dialog', ConfirmDialog);
