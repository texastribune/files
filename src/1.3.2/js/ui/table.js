import {Dialog} from "./dialog.js";
import {Element, DroppableMixin, DraggableMixin} from "./element.js";
import {compareDateStrings, compareNumbers, compareStrings} from "../utils.js";


class TableElement extends Element {
  get table(){
    let element = this.parentElement;
    while (element){
      if (element instanceof Table) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }
}

class BaseRow extends TableElement {
  constructor() {
    super();
  }

  get css(){
    // language=CSS
    return `
        :host {
            display: table-row;
            width: 100%;
        }
     `;
  }

  get template(){
    return `
      <slot></slot>
    `;
  }

  get data(){
    let data = [];
    for (let child of this.children){
      data.push(child.data);
    }
    return data;
  }


}

export class Header extends BaseRow {
  get css(){
    // language=CSS
    return super.css +  `
        :host {
            display: table-row-group;
            width: 100%;
            color: var(--table-header-text-color);
            background: var(--table-header-color);
            text-transform: uppercase;
        }
        
        a {
            text-decoration: none;
            color: var(--table-header-text-color);
            font-weight: bold;
        }
     `;
  }
}

export class Body extends TableElement {
  get css(){
    // language=CSS
    return `
        :host {
            display: table-row-group;
            width: 100%;
        }
     `;
  }

  get template(){
    return `
      <slot></slot>
    `;
  }
}

/**
 * An row element for use in a Table.
 * @extends Element
 * @mixes DroppableMixin
 * @mixes DraggableMixin
 */
export class Row extends DraggableMixin(DroppableMixin(BaseRow)) {
  /**
   * An row element for use in a Table.
   */
  constructor(){
    super();

    this.selected = false;
    this.hidden = false;

    this.onclick = (event) => {
      this.toggleSelected();
    }
  }

  // getters

  static get dataTransferType(){
    return "text/table-rows";
  }

  static get hiddenClass(){
    return "hidden";
  }

  static get selectedClass(){
    return "selected";
  }

  get css () {
    // language=CSS
    return super.css + `
        :host(:hover) {
            background: var(--focus-item-color);
            cursor: pointer;
        }
        
        :host(.${this.constructor.selectedClass}){
          background-color: var(--selected-item-color);
          color: #fff;
        }
        
        :host(.dragover) {
            background: var(--focus-item-color);
        }
        
        a.button {
          -webkit-appearance: button;
          -moz-appearance: button;
          appearance: button;
        
          text-decoration: none;
          color: initial;
        }
    `;
  }

  get selected(){
    return this.classList.contains(this.constructor.selectedClass);
  }

  get data(){
    let data = [];
    for (let child of this.children){
      data.push(child.data);
    }
    return data;
  }

  get hidden(){
    return this.classList.contains(this.constructor.hiddenClass);
  }

  // setters

  set selected(value){
    if (value){
      this.classList.add(this.constructor.selectedClass);
    } else {
      this.classList.remove(this.constructor.selectedClass);
    }
  }

  set hidden(value){
    if (value){
      this.classList.add(this.constructor.hiddenClass);
    } else {
      this.classList.remove(this.constructor.hiddenClass);
    }
  }

  toggleSelected(){
    this.selected = !this.selected;
  }
}

// // language=CSS
// const bodyCSS = `
//     :root{
//         display: block;
//         overflow: auto;
//         width: 100%;
//         height: 400px;
//         color: var(--body-text-color);
//     }
// `;
//
// class Body extends Element {
//   get template() {
//     return `
//         <style>
//             :root{
//                 display: block;
//                 overflow: auto;
//                 width: 100%;
//                 height: 400px;
//                 color: var(--body-text-color);
//             }
//         </style>
//         <slot></slot>
//       `;
//   }
// }

export class Data extends TableElement {
  constructor(){
    super();


  }

  get css(){
    // language=CSS
    return `
        :host {
            display: table-cell;
            padding: 0;
            height: var(--table-row-height);
            text-align: start;
            font-size: calc(4px + .75vw);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
     `;
  }

  get template(){
    return `
      <slot></slot>
    `;
  }

  static get observedAttributes() {
    return ['width', 'height'];
  }

  get data(){
    return this.innerText;
  }

  set data(value){
    this.innerText = value.toString();
  }

  get width(){
    return this.style.width;
  }

  set width(value){
    this.style.width= value;
  }

  get height(){
    return this.style.height;
  }

  set height(value){
    this.style.height = value;
  }

  get columnNumber(){
    let siblings = Array.from(this.parentElement.children);
    return siblings.indexOf(this);
  }

  compare(dataElement){
    return this.data.localeCompare(dataElement.data);
  }
}


/**
 * An interactive table element.
 * @extends Element
 * @mixes DroppableMixin
 */
export class Table extends DroppableMixin(Element) {
  constructor(selectMultiple){
    super();

    this._selectMultiple = selectMultiple || false;
    this.contextMenu = null;

    // Deselected other rows if selectMultiple is false
    this.onclick = (event) => {
      if (event.target instanceof Row && !this._selectMultiple) {
        for (let row of this.selectedRows){
          if (row !== event.target){
            row.selected = false;
          }
        }
      }
    };
  }

  // getters

  static get headerClass(){
    return 'header';
  }

  static get bodyClass(){
    return 'body';
  }

  static get showHiddenClass(){
    return 'show-hidden';
  }

  get css(){
    // language=CSS
    return `        
        :host {
            padding: 0;
            width: 100%;
            height: 400px;
            background-color: var(--table-background-color);
            table-layout: fixed;
            border-spacing: 0;
            box-shadow: none;
            color: var(--body-text-color);
        }
        
        #container {
          width: 100%;
          height: 100%;
          overflow: auto;
          padding-top: var(--table-row-height);
          padding-bottom: var(--table-row-height);
        }
        
        #table {
          display: table;
          width: 100%;
        }
        
        a {
            text-decoration: none;
            color: var(--selected-item-color);
            font-weight: bold;
        }
     `;
  }

  get template(){
    return `
      <div id="container">
        <div id="table">
           <slot></slot>
        </div>
      </div>
    `;
  }

  get selectedData(){
    // Depends on length of row and data being the same;
    let data = new Set();
    for (let row of this.selectedRows) {
      data.add(row.data);
    }
    return data;
  }

  get selectedRows(){
    return Array.from(this.querySelectorAll(`.${Row.selectedClass}`));
  }

  get showHidden(){
    return this.classList.contains(this.constructor.showHiddenClass);
  }

  get visibleColumnsDialog(){
    if (!this._columnsDialog){
      this._columnsDialog = new Dialog();
      this._columnsDialog.name = "Columns";
    }

    let dialogItems = [];
    for (let column of this.columns){
      let div = document.createElement('div');
      let columnLabel = document.createElement('span');
      let columnCheckbox = document.createElement('input');
      columnCheckbox.type = 'checkbox';
      columnCheckbox.checked = column.visible;
      columnLabel.innerText = column.name;
      columnCheckbox.onchange = () => {
        column.visible = columnCheckbox.checked;
      };
      div.appendChild(columnLabel);
      div.appendChild(columnCheckbox);
      dialogItems.push(div);
    }

    this._columnsDialog.items = dialogItems;
    return this._columnsDialog;
  }

  // setters

  set selectMultiple(value){
    this._selectMultiple = value;
    this.toggleRowSelection(null);
  }

  set showHidden(value){
    if (value) {
      this.classList.add(this.constructor.showHiddenClass);
    } else {
      this.classList.remove(this.constructor.showHiddenClass);
    }
  }

  clone(){
    return new this.constructor(columnsCopy, this._selectMultiple);
  }

  // Internal Events

  _onRowDrag(row, event){
    // If the row is not already selected we need to
    if (!this._selectedRows.has(row)){
      this._onRowClick(row, event);
    }

    event.dataTransfer.setData(Table.dataTransferType,
                               JSON.stringify(Array.from(this.selectedData)));
    event.dataTransfer.dropEffect = 'move';

    // Attempt to create better drag image. Doesn't work.

    // let dialog = new Dialog();
    // let dialogItems = [];
    // for (let row of this._selectedRows){
    //   let clone = row.element.cloneNode(true);
    //   dialogItems.push(clone);
    // }
    // dialog.items = dialogItems;
    // dialog.show();
    // dialog.startDrag();
    // row.onDragEnd = () => {
    //   dialog.remove();
    // };
  }

  _onSelectedRowsChange(newSelectedRows, oldSelectedRows){
    let addedRows = [...newSelectedRows].filter(x => !oldSelectedRows.has(x));
    let removedRows = [...oldSelectedRows].filter(x => !newSelectedRows.has(x));
    let change = addedRows.length > 0 || removedRows.length > 0;

    for (let row of removedRows){
      row.element.classList.remove(this._selectedRowClassName);
    }
    for (let row of addedRows){
      row.element.classList.add(this._selectedRowClassName);
    }

    if (change && this.onSelectionChanged){
      this.onSelectionChanged(newSelectedRows, addedRows, removedRows);
    }
  }
}

customElements.define('table-header', Header);
customElements.define('table-body', Body);
customElements.define('table-row', Row);
customElements.define('table-data', Data);
customElements.define('selectable-table', Table);
