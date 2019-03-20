"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const element_1 = require("elements/lib/element");
const dialog_1 = require("elements/lib/dialog");
class Message extends element_1.CustomElement {
    constructor() {
        super(...arguments);
        this.delay = null;
    }
    static get observedAttributes() {
        return ['delay'];
    }
    get css() {
        // language=CSS
        return super.css + `
      :host {
        --message-height: 24px;
        --success-color: #90ee90;
        --error-color: lightcoral;
        --delete-button: url(${dialog_1.Dialog.DETETE_BUTTON_URL});

        display: inline-block;
        box-sizing: border-box;
        position: relative;
        width: 75%;
        height: var(--message-height);
        line-height: var(--message-height);
        padding-left: 5px;
        border-bottom: 2px solid var(--success-color);
        overflow: hidden;
      }
      
      :host([error]){
        border-bottom: 2px solid var(--error-color);
      }

      div {
        float: right;
        width: var(--message-height);
        height: var(--message-height);
        background-image: var(--delete-button);
        background-size: calc(.75 * var(--message-height));
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
    render(shadowRoot) {
        super.render(shadowRoot);
        let slot = document.createElement('slot');
        shadowRoot.appendChild(slot);
        let deleteButton = document.createElement('div');
        deleteButton.onclick = (event) => {
            event.preventDefault();
            this.remove();
        };
        shadowRoot.appendChild(deleteButton);
    }
    updateAttributes(attributes) {
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
exports.Message = Message;
customElements.define('user-message', Message);
