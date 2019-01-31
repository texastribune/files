
import {CustomElement} from "elements/lib/element";
import {FileBrowser} from "./browser";

export class Message extends CustomElement {
  private delay : number | null = null;


  static className = 'error';

  static get observedAttributes() {
    return ['delay'];
  }

  get css() {
    // language=CSS
    return `
      :host {
        --message-height: 24px;
        --success-color: #90ee90;
        --error-color: lightcoral;

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
        width: var(--message-height);
        height: var(--message-height);
      }
    `
  }

  get message(){
    return this.innerText;
  }

  set message(value){
    this.innerText = value;
  }

  render(shadowRoot: ShadowRoot): void {
    let slot = document.createElement('slot');
    shadowRoot.appendChild(slot);

    let deleteButton = document.createElement('div');
    deleteButton.onclick = (event) => {
      event.preventDefault();
      this.remove();
    };

    shadowRoot.appendChild(deleteButton);
  }


  updateAttributes(attributes: { [p: string]: string | null }): void {
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