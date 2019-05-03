import { CustomElement } from "elements/lib/element.js";
import { Dialog } from "elements/lib/dialog.js";
export class Message extends CustomElement {
    constructor() {
        super();
        this.delay = null;
        let slot = document.createElement('slot');
        let deleteButton = document.createElement('div');
        deleteButton.onclick = (event) => {
            event.preventDefault();
            this.remove();
        };
        this.shadowDOM.appendChild(slot);
        this.shadowDOM.appendChild(deleteButton);
    }
    static get observedAttributes() {
        return ['delay'];
    }
    get css() {
        // language=CSS
        return super.css + `
      :host {
        --height: var(--message-height, 24px);
        --delete-button: url(${Dialog.DETETE_BUTTON_URL});

        display: inline-block;
        box-sizing: border-box;
        position: relative;
        width: 75%;
        height: var(--height);
        line-height: var(--height);
        padding-left: 5px;
        border-bottom: 2px solid var(--success-color, #90ee90);
        overflow: hidden;
      }
      
      :host([error]){
        border-bottom: 2px solid var(--error-color, lightcoral);
      }

      div {
        float: right;
        width: var(--height);
        height: var(--height);
        background-image: var(--delete-button);
        background-size: calc(.75 * var(--height));
        background-repeat: no-repeat;
        background-position: center;
        cursor: pointer;
      }
    `;
    }
    get message() {
        return this.innerText;
    }
    set message(value) {
        this.innerText = value;
    }
    updateFromAttributes(attributes) {
        if (attributes.delay !== null) {
            this.delay = Number.parseInt(attributes.delay);
        }
        else {
            this.delay = null;
        }
    }
    connectedCallback() {
        super.connectedCallback();
        if (this.delay !== null) {
            window.setTimeout(() => {
                this.remove();
            }, this.delay);
        }
    }
}
Message.className = 'error';
customElements.define('user-message', Message);
