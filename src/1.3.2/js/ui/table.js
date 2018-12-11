import {Dialog} from "./dialog.js";
import {Element, DroppableMixin, DraggableMixin} from "./element.js";
import {compareDateStrings, compareNumbers, compareStrings} from "../utils";

// language=CSS
const columnCss = `

`;


/**
 * An column for use in a Table.
 * @extends Element
 */
class Column extends Element {
  constructor(name, rowRenderer, sortCompare, width, visible){
    super();

    this.rowRenderer = rowRenderer;

    this.ascendingSortClass = 'asc';
    this.descendingSortClass = 'dsc';

    this._sortCompare = sortCompare || null;  // Unsortable if no sortcompare given

    // Event callbacks
    this.onWidthChange = null;
    this.onVisibilityChange = null;
    this.onSort = null;

    // Set by attribute
    this._visible = visible === undefined ? true : visible;
    this._path = null;

    this.style.display = 'flex';
    this.width = width || 1;  // can be set as an integer representing relative_length

    this.onclick = this.toggleSort.bind(this);
  }

  // getters
  static get observedAttributes() { return ['path', 'visible']; }

  get css(){
      // language=CSS
      return `
        :root {
            display: flex;
            padding: 0;
            height: 50px;
        }

        .file-browser-table-container > .table .column-header.asc::after {
            content: "\\25B2";
        }

        .file-browser-table-container > .table .column-header.dsc::after {
            content: "\\25BC";
        }
   `
  }

  get template() {
    return `
        <slot></slot>
      `;
  }

  get path(){
    return this._path || this.innerHTML;
  }

  get width(){
    return this._width;
  }

  get ascending(){
    return this.element.classList.contains(this.ascendingSortClass);
  }

  get descending(){
    return this.element.classList.contains(this.descendingSortClass);
  }

  get visible(){
    return this._visible;
  }

  // setters

  set width(value){
    // this.style.width = value;
    this.style.flex = value;
    if (this.onWidthChange) {
      this.onWidthChange(value);
    }
  }

  set visible(value){
    let oldValue = this._visible;
    this._visible = Boolean(value);
    if (oldValue !== this._visible){
      if (this.onVisibilityChange) {
        this.onVisibilityChange(this._visible);
      }
    }
  }

  set path(value){
    this._path = value;
  }

  set type(value){
    switch (value) {
        case 'date':
          this._sortCompare = compareDateStrings;
          break;
        case 'number':
          this._sortCompare = compareNumbers;
          break;
        default:
          this._sortCompare = compareStrings
    }
  }

  clone() {
    return new this.constructor(this.name, this.rowRenderer,
                                this.sortCompare, this.width,
                                this.visible);
  }

  renderRow(rowData){
    let rowElement = document.createElement('div');

    rowElement.classList.add(this.itemClass);
    rowElement.style.flex = `${this.width}`;
    rowElement.style.padding = '0';
    rowElement.style.height = '100%';
    this.rowRenderer(rowElement, rowData);
    rowElement.innerText = rowData[this.path];
    return rowElement;
  }

  sortRows(rows){
    if (this.ascending){
      rows.sort((row1, row2) => {
        return this.sortCompare(row1.data, row2.data);
      })
    } else if (this.descending){
      rows.sort((row1, row2) => {
        return this.sortCompare(row2.data, row1.data);
      })
    }
  }

  toggleSort(){
    if (this.ascending){
      this.classList.remove(this.ascendingSortClass);
      this.classList.add(this.descendingSortClass);
      this.parentElement.sort();
    } else {
      this.classList.remove(this.descendingSortClass);
      this.classList.add(this.ascendingSortClass);
    }
    if (this.onSort){
      this.onSort(this);
    }
  }

  clearSort(){
    this.element.classList.remove(this.ascendingSortClass);
    this.element.classList.remove(this.descendingSortClass);
  }
}


// class Header extends Element {
//   constructor(props) {
//     super(props);
//     this.style.display = 'flex';
//     let mutationObserver = new MutationObserver((mutationList) => {
//       for (let mutation of mutationList){
//         if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
//           this.onColumnsChanged();
//         }
//       }
//     });
//     mutationObserver.observe(this.element, {childList: true, subtree: true});
//   }
//
//   render(root){
//     let slot = document.createElement('slot');
//     root.appendChild(slot);
//
//     for (let column of this._columns){
//       if (column.visible){
//         headerRow.appendChild(column.element);
//       }
//     }
//
//     this.header.appendChild(headerRow);
//   }
//
//   onColumnsChanged(){
//     for (let child of this.parentElement.children){
//       if (child instanceof Body){
//         for (let row of child.children){
//           for (let column of this.children){
//
//           }
//         }
//       }
//     }
//   }
// }

/**
 * An row element for use in a Table.
 * @extends Element
 * @mixes DroppableMixin
 * @mixes DraggableMixin
 */
class Row extends DraggableMixin(DroppableMixin(Element)) {
  /**
   * An row element for use in a Table.
   */
  constructor(){
    super();

    this.selected = false;
    this.columns = [];
    this.data = data || {};
    this.hidden = false;

    // Event callbacks
    this.onClick = null;
    this.onDblClick = null;
  }

  // getters

  static get dataTransferType(){
    return "text/table-rows";
  }

  get css(){
    // language=CSS
    return `
        :root {
            display: flex;
        }
     `
  }

  get template(){
    return `
      <slot></slot>
    `;
  }

  get selected(){
    return this.classList.contains('.selected');
  }

  get data(){
    return this._data || {};
  }

  get hidden(){
    return this._hidden;
  }

  // setters

  set selected(value){
    if (value){
      this.classList.add('selected');
    } else {
      this.classList.remove('selected');
    }
  }

  set data(value){
    this._data = value;
  }

  set hidden(value){
    this._hidden = value;
  }

  set columns(value){
    this.removeChildren();

    this._columns = value;
    for (let column of this._columns){
      this.appendChild(column.renderRow(this.data));
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

class Data extends Element {
  constructor(){
    super();


  }


}


/**
 * An interactive table element.
 * @extends Element
 * @mixes DroppableMixin
 */
class Table extends DroppableMixin(Element) {
  constructor(selectMultiple){
    super();

    this._element.appendChild(this.header);
    this._element.appendChild(this.body);

    this._headerClassName = 'header';
    this._selectedRowClassName = 'selected';

    // Event callbacks
    this.onRowClick = null;
    this.onRowDblClick = null;
    this.onContextMenu = null;
    this.onColumnsChanged = null;
    this.onRowsChanged = null;
    this.onDataChanged = null;
    this.onSelectionChanged = null;

    this._selectMultiple = selectMultiple || false;
    this._columns = [];
    this._selectedRows = new Set();
    this._rows = [];
    this._showHidden = false;
    this.contextMenu = null;
    this._defaultSortFunc = null;

     let mutationObserver = new MutationObserver((mutationList) => {
      for (let mutation of mutationList){
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
           this.onColumnsChanged();
         }
      }
    });
    mutationObserver.observe(this.element, {childList: true, subtree: true});
  }

  // getters

  static get headerClass(){
    return 'header';
  }

  static get bodyClass(){
    return 'body';
  }

  get rows(){
    return this._rows.slice();
  }

  get defaultSortFunc(){
    return this._defaultSortFunc;
  }

  get selectedData(){
    // Depends on length of row and data being the same;
    let data = new Set();
    for (let row of this._selectedRows) {
      data.add(row.data);
    }
    return data;
  }

  get selectedRows(){
    return Array.from(this.body.children).filter((column) => {column.selected});
  }

  get showHidden(){
    return this._showHidden;
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
    value = Boolean(value);
    if (value !== this._showHidden){
      this._showHidden = value;
      this.renderRows();
    }
  }

  set columns(columns){
    this._columns = columns;

    // Update header
    this.renderHeader();

    // Update rows
    for (let row of this._rows){
      row.columns = this._columns;
    }

    for (let column of this._columns){
      column.onWidthChange = column.onVisibilityChange = (width) => {
        // Re-render rows to update width.
        // Header column widths will be handled by this column object itself.
        this.renderHeader();
        for (let row of this._rows){
          row.render();
        }
      };
      column.onSort = (sortColumn) => {
        for (let column of this._columns){
          if (column !== sortColumn){
            column.clearSort();
          }
        }
        sortColumn.sortRows(this._rows);
        this.renderRows();
      }
    }

    if (this.onColumnsChanged){
      this.onColumnsChanged(columns);
    }
  }

  set data(data){
    for (let column of this.children){
      column.clearSort();
    }

    if (this._defaultSortFunc){
      data.sort(this._defaultSortFunc);
    }

    this._rows = [];

    for (let rowData of data){
      let row = document.createElement('table-row');
      row.onclick = this._onRowClick.bind(this);
      row.ondblclick = this._onRowDblClick.bind(this);
      row.oncontextmenu = (event) => {
        if (!this._selectedRows.has(row)){
          // If the row is not already selected we need to treat this like a click as well
          this._onRowClick(row, event);
        }
        if (this.onContextMenu){
          this.onContextMenu(event);
          return false;
        }
        return true;
      };
      row.ondragstart = (event) => {
        this._onRowDrag(row, event);
      };

      row.data = rowData;
      for (let column of this.children){
        row.appendChild(column.renderRow(rowData));
      }

      this._rows.push(row);
    }

    this.toggleRowSelection(null);

    if (this.onRowsChanged){
      this.onRowsChanged(this._rows);
    }

    if (this.onDataChanged){
      this.onDataChanged(data);
    }
  }

  appendShadowChild(element){
    if (element instanceof Column){

    }
    this.shadowRoot.appendChild(frag);
  }

  /**
   * Add children in bulk to the shadow dom
   * @param {NodeList} elements
   */
  appendShadowChildren(elements){
    let frag = document.createDocumentFragment();
    for (let element of elements){
      frag.appendChild(element);
    }
    this.shadowRoot.appendChild(frag);
  }

  clone(){
    let columnsCopy = [];
    for (let column of this._columns){
      columnsCopy.push(column.clone());
    }
    return new this.constructor(columnsCopy, this._selectMultiple);
  }

  render(root){
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


  _onRowClick(row, event){
    if (this.onRowClick){
      this.onRowClick(row, event);
    }

    if (!event.defaultPrevented){
      let includeBetween, selectMultiple;
      if (this._selectMultiple){
        if (event.shiftKey){
          includeBetween = true;
          selectMultiple = true;
        }else if (event.ctrlKey || event.metaKey){
          includeBetween = false;
          selectMultiple = true;
        }else{
          includeBetween = false;
          selectMultiple = false;
        }
      }else{
        includeBetween = false;
        selectMultiple = false
      }

      this.toggleRowSelection(row, selectMultiple, includeBetween);
    }

    return true;
  }

  _onRowDblClick(row, event){
    if (this.onRowDblClick){
      this.onRowDblClick(row, event);
    }
  }

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

  renderRows(){
    while (this.body.firstChild) {
      this.body.removeChild(this.body.firstChild);
    }

    let frag = document.createDocumentFragment();
    for (let row of this._rows){
      if (this._showHidden || !row.hidden) {
        frag.appendChild(row.element);
      }
    }
    this.body.appendChild(frag);
  }

  onColumnsChanged(){

  }


  // toggleRowSelection(rowElement, selectMultiple, includeBetween) {
  //   /* Toggles the selection of a row. The argument can either be a row element in
  //    * the browser or null. If null it will deselect all rows. A selected event is
  //    * fired on the row element when a row is first selected and deselect events
  //    * are similarly fired when its deselected. */
  //   let oldRows = new Set(this._selectedRows);  // Make copy
  //
  //   // Initialize new rows. If selectMultiple is true, we include the old selection.
  //   let newRows;
  //   if (selectMultiple){
  //     newRows = new Set(oldRows);
  //   } else {
  //     newRows = new Set();
  //   }
  //
  //   // If only the toggled rowElement was selected before we remove it. Otherwise we add it.
  //   if (!includeBetween && oldRows.has(rowElement)){
  //     newRows.delete(rowElement);
  //   }else if (rowElement !== null){
  //     newRows.add(rowElement);
  //   }
  //
  //   // Selects the rows between the previously selected rows and the toggled row if
  //   // includeBetween and selectMultiple are true.
  //   if (selectMultiple && includeBetween && oldRows.size > 0){
  //     let sliceIndex;
  //     let sectionIndex = this._rows.indexOf(rowElement);
  //     for (let row of oldRows){
  //       let index = this._rows.indexOf(row);
  //       if (!sliceIndex || Math.abs(index - sectionIndex) < Math.abs(sliceIndex - sectionIndex)){
  //         sliceIndex = index;
  //       }
  //     }
  //     let start = Math.min(sliceIndex, sectionIndex) + 1;
  //     let end = Math.max(sliceIndex, sectionIndex);
  //     let rowsBetween = this._rows.slice(start, end);
  //     for (let row of rowsBetween){
  //       if (this._showHidden || !row.hidden) {
  //         newRows.add(row);
  //       }
  //     }
  //   }
  //
  //   this.selectedRows = newRows;
  // }
}


export {Column, Table}
