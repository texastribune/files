import {CustomElement} from "./elements/element.js";
import {Dialog} from "./elements/dialog.js";

export class Message extends CustomElement {
  private delay : number | null = null;


  static className = 'error';

  constructor() {
    super();

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

  get css() : string {
    // language=CSS
    return super.css + `
      :host {
        --height: var(--message-height, 24px);
        --delete-button: url(${Dialog.DETETE_BUTTON_URL});

        display: block;
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
    `
  }

  get message() : string {
    return this.textContent || "";
  }

  set message(value : string){
    this.textContent = value;
  }


  updateFromAttributes(attributes: { [p: string]: string | null }): void {
    if (attributes.delay !== null) {
      this.delay = Number.parseInt(attributes.delay);
    } else {
      this.delay = null;
    }
  }


  connectedCallback(): void {
    super.connectedCallback();

    if (this.delay !== null){
      window.setTimeout(() => {
        this.remove();
      }, this.delay);
    }
  }
}

customElements.define('user-message', Message);