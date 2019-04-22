import {CustomElement} from "elements/lib/element";

export class BreadCrumbs extends CustomElement {
  private startCharacter : string = '|';
  private delimiter : string = '>';
  private readonly ul : HTMLUListElement;

  /**
   * @event
   */
  static EVENT_PATH_CHANGE = 'pathchange';

  constructor(){
    super();

    this.ul = document.createElement('ul');
  }

  updateAttributes(attributes: { [p: string]: string | null }): void {
  }

  get css(): string {
    // language=CSS
    return super.css + `
      :host {
        --breadcrumb-color: #5d91e5;
        --delimiter-color: #5c6873;
      }

      ul {
        margin: 0;
        padding: 0;
        list-style: none;
        height: 26px;
      }

      /* Display list items side by side */
      li {
        display: inline;
        font-size: 18px;
      }

      /* Add a slash symbol (/) before/behind each list item */
      li {
        color: var(--delimiter-color);
        margin-left: 10px;
        margin-right: 10px;
      }

      /* Add a color to all links inside the list */
      a {
        color: var(--breadcrumb-color);
        text-decoration: none;
        font-weight: bold;
      }

      /* Add a color on mouse-over */
      a:hover {
        color: #01447e;
        text-decoration: underline;
      }
    `;
  }

  get crumbs() : Iterable<HTMLAnchorElement> {
    if (this.shadowRoot === null){
      return [];
    }
    return this.shadowRoot.querySelectorAll('a');
  }

  get path() : string[] {
    let crumbs = this.crumbs;
    let path = [];
    for (let a of crumbs){
      path.push(a.innerText);
    }
    return path;
  }

  set path(value : string[]){
    while (this.ul.firstChild){
      this.ul.removeChild(this.ul.firstChild);
    }

    for (let i = 0; i < value.length; i++) {
      let delim = i == 0 ? this.startCharacter : this.delimiter;
      this.ul.appendChild(this.buildDelimiter(delim));
      let path = value.slice(0, i + 1);
      this.ul.appendChild(this.buildCrumb(path))
    }
  }

  render(shadowRoot: ShadowRoot): void {
    super.render(shadowRoot);
    shadowRoot.appendChild(this.ul);
  }

  buildCrumb(path : string[]){
    let li = document.createElement('li');
    let crumb = document.createElement('a');
    crumb.href = '#';
    crumb.innerText = path[path.length-1];

    crumb.onclick = (event : Event) => {
      event.preventDefault();

      this.path = path;
      this.dispatchEvent(new Event(BreadCrumbs.EVENT_PATH_CHANGE));
    };
    li.appendChild(crumb);
    return li;
  }

  buildDelimiter(char : string) : HTMLElement {
    let delimiter = document.createElement('li');
    delimiter.innerText = char;
    return delimiter;
  }
}

customElements.define('bread-crumbs', BreadCrumbs);