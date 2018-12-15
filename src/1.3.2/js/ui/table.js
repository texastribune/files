import {Dialog} from "./dialog.js";
import {Element, DroppableMixin, DraggableMixin, ScrollWindowElement} from "./element.js";
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
            --selected-item-color: #5d91e5;
            --focus-item-color: #c0d5e8;

            display: flex;
            width: 100%;
            height: var(--table-row-height, 30px);
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
  constructor(){
    super();
    this.setAttribute('slot', Table.headerSlotName);
  }

  get css(){
    // language=CSS
    return super.css + `
        :host {
            --table-header-text-color: white;
            --table-header-color: #5c6873;
            
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

export class Body extends ScrollWindowElement {

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

export class Data extends TableElement {
  constructor(){
    super();

    this.style.flex = 1;

    this.onclick = () => {
      if (this.parentElement instanceof Header){
        this.table.sortColumn(this.column);
      }
    }
  }

  static get observedAttributes() {
    return ['width'];
  }

  static get ascendingSortClass(){
    return "asc";
  }

  static get descendingSortClass(){
    return "des";
  }

  get css(){
    // language=CSS
    return `
        :host {
            padding: 0;
            text-align: start;
            font-size: calc(4px + .75vw);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        :host::after {
            float: right;
            padding: 5px;
        }

        :host(.${this.constructor.ascendingSortClass})::after {
           content: "\\25BC";
        }

        :host(.${this.constructor.descendingSortClass})::after {
            content: "\\25B2";
        }

    `;
  }

  get template(){
    return `
      <slot></slot>
    `;
  }

  get data(){
    return this.innerText;
  }

  set data(value){
    this.innerText = value.toString();
  }

  get width(){
    return Number.parseInt(this.style.flex);
  }

  get column(){
    return Array.from(this.parentElement.children).indexOf(this);
  }

  get sortOrder(){
    if (this.classList.contains(this.constructor.ascendingSortClass)){
      return 1;
    } else if (this.classList.contains(this.constructor.descendingSortClass)){
      return -1;
    }
    return 0;
  }

  compare(dataElement){
    return this.data.localeCompare(dataElement.data);
  }

  toggleSortOrder(){
    let next = this.constructor.ascendingSortClass;
    if (this.classList.contains(this.constructor.ascendingSortClass)){
      next = this.constructor.descendingSortClass;
    } else if (this.classList.contains(this.constructor.descendingSortClass)){
      next = null;
    }

    this.classList.remove(
      this.constructor.ascendingSortClass,
      this.constructor.descendingSortClass
    );

    if (next !== null) {
      this.classList.add(next);
    }
  }
}


/**
 * An interactive table element.
 * @extends Element
 * @mixes DroppableMixin
 */
export class Table extends DroppableMixin(ScrollWindowElement) {
  constructor(selectMultiple){
    super();

    this._columnWidths = {};
    this._selectMultiple = selectMultiple || false;
    this.contextMenu = null;

    // Deselected other rows if selectMultiple is false
    this.onclick = (event) => {
      let element = event.target;
      if (element instanceof Row && !this._selectMultiple) {
        for (let row of this.selectedRows){
          if (row !== element){
            row.selected = false;
          }
        }
      }
    };

    this._sortStack = [];
  }

  // getters

  static get headerSlotName(){
    return 'header';
  }

  static get headerContainerClass(){
    return 'header';
  }

  static get showHiddenClass(){
    return 'show-hidden';
  }

  static get observedAttributes() {
    return ['selectMultiple'];
  }

  get css(){
    // language=CSS
    return `      
        :host {
            --table-row-height: 30px;
            --table-background-color: white;
          
            position: relative;
            padding: 0;
            width: 100%;
            height: 400px;
            background-color: var(--table-background-color);
            border-spacing: 0;
            box-shadow: none;
            color: var(--body-text-color);
        }
        
        a {
            text-decoration: none;
            color: var(--selected-item-color);
            font-weight: bold;
        }
        
        .${this.constructor.headerContainerClass} {
            width: 100%;
        }
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
    for (let row of this.flatChildren(Row)){
      row.selected = false;
    }
  }

  set showHidden(value){
    if (value) {
      this.classList.add(this.constructor.showHiddenClass);
    } else {
      this.classList.remove(this.constructor.showHiddenClass);
    }
  }

  get mainHeader(){
    return this.querySelector('table-header');
  }

  render(shadowRoot){
    let headerContainer = document.createElement('div');
    headerContainer.className = this.constructor.headerContainerClass;
    let headerSlot = document.createElement('slot');
    headerSlot.name = this.constructor.headerSlotName;
    headerContainer.appendChild(headerSlot);
    shadowRoot.appendChild(headerContainer);
    super.render(shadowRoot);
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

  sortColumn(index){
    let header = this.mainHeader;
    if (header){
      let dataElement = header.children.item(index);
      if (dataElement) {
        dataElement.toggleSortOrder();
        if (dataElement.sortOrder === 0){
          let index = this._sortStack.indexOf(dataElement);
          if (index){
            this._sortStack.splice(index, 1);
          }
        } else {
          this._sortStack.push(dataElement);
        }
        this._sort();
      }
    }
  }

  _sort(){
    let frag = document.createDocumentFragment();
    let rows = this.flatChildren(Row);

    // Create array of arrays that have form [column index, sort order] for each column in sort stack.
    let sortData = [];
    for (let dataElement of this._sortStack) {
      let order = dataElement.sortOrder;
      if (order !== 0) {
        sortData.unshift([dataElement.column, dataElement.sortOrder]);
      }
    }
    rows = rows.sort((row1, row2) => {
      for (let items of sortData){
        let index = items[0];
        let order = items[1];
        let dataElement1 = row1.children.item(index);
        let dataElement2 = row2.children.item(index);
        dataElement1.compare(dataElement2);
        let result = order * dataElement1.compare(dataElement2);
        if (result !== 0) {
          return result;
        }
      }
      return 0;
    });
    for (let row of rows){
      frag.appendChild(row);
    }
    this.appendChild(frag);
  }
}

customElements.define('table-header', Header);
customElements.define('table-body', Body);
customElements.define('table-row', Row);
customElements.define('table-data', Data);
customElements.define('selectable-table', Table);
