import {CustomElement} from 'elements/lib/element.js';

export class BreadCrumbs extends CustomElement {
  private delimiter : string = '>';
  private readonly ul : HTMLUListElement;

  static emptyCharacter = "|";

  /**
   * @event
   */
  static EVENT_PATH_CHANGE = 'pathchange';

  constructor(){
    super();

    this.ul = document.createElement('ul');
    this.shadowDOM.appendChild(this.ul);
  }

  updateFromAttributes(attributes: { [p: string]: string | null }): void {}

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
        
      a:empty::after {
        content: "${BreadCrumbs.emptyCharacter}";
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
      path.push(a.textContent || "");
    }
    return path;
  }

  set path(value : string[]){
    while (this.ul.firstChild){
      this.ul.removeChild(this.ul.firstChild);
    }

    this.ul.appendChild(this.buildCrumb(value.slice(0, 1)));

    for (let i = 1; i < value.length; i++) {
      this.ul.appendChild(this.buildDelimiter(this.delimiter));

      let path = value.slice(0, i + 1);
      this.ul.appendChild(this.buildCrumb(path))
    }
  }

  buildCrumb(path : string[]){
    let li = document.createElement('li');
    let crumb = document.createElement('a');
    crumb.href = '#';
    crumb.textContent = path[path.length-1];

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
    delimiter.textContent = char;
    return delimiter;
  }
}

customElements.define('bread-crumbs', BreadCrumbs);