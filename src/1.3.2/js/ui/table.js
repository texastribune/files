import {Dialog} from "./dialog.js";
import {Element, DroppableMixin, DraggableMixin} from "./element.js";
import {compareDateStrings, compareNumbers, compareStrings} from "../utils.js";

class BaseRow extends Element {
  constructor() {
    super();
  }

  get css(){
    // language=CSS
    return `
        :host {
            display: flex;
            height: var(--table-row-height);
        }
     `
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

export class Header extends BaseRow {
  get css(){
    // language=CSS
    return super.css +  `
        :host {
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

  setWidths(){
    for (let i = 0; i < this.parent.length; i++) {
      const selectedElement = selected[i];

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

export class Data extends Element {
  constructor(){
    super();


  }

  get css(){
    // language=CSS
    return `
        :host {
            flex: 1;
            padding: 0;
            height: 100%;
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
    return ['width'];
  }

  get data(){
    return this.innerText;
  }

  set data(value){
    this.innerText = value.toString();
  }

  get width(){
    return this.style.flex;
  }

  set width(value){
    this.style.flex = value;
    if (this.parentElement instanceof Header){
      this.parentElement.table.updateWidths();
    }
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
    }
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
            flex: 1;
            padding: 0;
            width: 100%;
            height: 400px;
            background-color: var(--table-background-color);
            display: block;
            table-layout: fixed;
            border-spacing: 0;
            box-shadow: none;
            overflow: auto;
            color: var(--body-text-color);
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
      <slot></slot>
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

  render(root){
    super.render(root);

    let slot = document.createElement('slot');

    let headerRow = document.createElement('div');
    headerRow.className = this.constructor.headerClass;
    headerRow.style.display = 'flex';

    this.body = document.createElement('div');
    this.body.className = this.constructor.bodyClass;

    headerRow.appendChild(slot);
    root.appendChild(headerRow);
    root.appendChild(this.body);
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


  // Actions

  updateWidths(){
    let rows = Array.from(this.children);
    let frag = document.createDocumentFragment();
    let header = null;
    while (rows.length > 0) {
      let row = rows.shift();
      frag.appendChild(row);
      if (header){
        for (let i = 0; i < header.children.length; i++) {
          const headerDataElement = header.children.item(i);
          const rowDataElement = row.children.item(i);
          rowDataElement.width = headerDataElement.width;
          console.log("SET WITH", headerDataElement.width);
        }
      }
      if (row instanceof Header){
        header = row;
      }
    }
    this.appendChild(frag);
    console.log("UPDATED")
  }
}

customElements.define('table-header', Header);
customElements.define('table-row', Row);
customElements.define('table-data', Data);
customElements.define('selectable-table', Table);
