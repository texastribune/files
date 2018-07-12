import {Element} from "./element.js";

export class Message extends Element {
  constructor(message, error, delay){
    super();

    this._delay = delay || null;
    this._errorClass = 'error';
    this.className = 'message';
    this.buttonClass = 'dialog-button delete';
    this.message = message;
    this.error = error || false;

    if (this._delay){
      window.setTimeout(() => {
        this.remove();
      }, this._delay)
    }
  }

  static get type(){
    return 'div';
  }

  get message(){
    return this._message;
  }

  get error(){
    return this._error;
  }

  set message(value){
    this._message = value;
    this._text.innerText = this._message;
  }

  set error(value){
    this._error = Boolean(value);
    if (this._error){
      this.element.classList.add(this._errorClass);
    } else {
      this.element.classList.remove(this._errorClass);
    }
  }

  set buttonClass(value){
    this._deleteButton.className = value;
  }

  render() {
    super.render();

    this._text = document.createElement('span');

    this._deleteButton = document.createElement('div');
    this._deleteButton.onclick = () => {
      this.element.parentElement.removeChild(this.element);
    };
    this._deleteButton.onclick = (event) => {
      event.preventDefault();
      this.remove();
    };

    this.element.appendChild(this._text);
    this.element.appendChild(this._deleteButton);
  }

  remove(){
    this.element.parentElement.removeChild(this.element);
  }
}
