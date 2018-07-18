import {Dialog} from "./dialog.js";
import {Element, DroppableMixin, DraggableMixin} from "./element.js";


class Column extends Element {
  /**
   * An column for use in a Table.
   */
  constructor(name, rowRenderer, sortCompare, width, visible){
    super();
    this._name = name;
    this.rowRenderer = rowRenderer;

    this.ascendingSortClass = 'asc';
    this.descendingSortClass = 'dsc';

    this.className = 'column-header';
    this.itemClass = 'column-row';

    this._sortCompare = sortCompare || null;  // Unsortable if no sortcompare given

    // Event callbacks
    this.onWidthChange = null;
    this.onVisibilityChange = null;
    this.onSort = null;

    this._visible = visible === undefined ? true : visible;

    this.width = width || 1;  // can be set as an integer representing relative_length
    this._renderHeader();
  }

  // getters

  static get type(){
    return 'div';
  }

  get name(){
    return this._name;
  }

  get width(){
    return this._width;
  }

  get sortCompare(){
    return this._sortCompare;
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
    this._width = value;
    this._element.style.width = this._width;
    if (this.onWidthChange) {
      this.onWidthChange(this._width);
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

  clone() {
    return new this.constructor(this.name, this.rowRenderer,
                                this.sortCompare, this.width,
                                this.visible);
  }

  _renderHeader(){
    this.element.classList.add(this.itemClass);
    this.element.style.flex = `${this.width}`;
    this.element.style.padding = '0';
    this.element.style.height = '100%';

    this.removeChildren();

    if (this.sortCompare){
      let a = document.createElement('a');
      a.setAttribute('href', '#');
      a.onclick = (e) => {
        e.preventDefault();
        this.toggleSort();
      };
      a.innerText = this._name;
      this.element.appendChild(a);
    } else {
      let span = document.createElement('span');
      span.innerText = this._name;
      this.element.appendChild(span);
    }
  }

  renderRow(rowData){
    let rowElement = document.createElement('div');

    rowElement.classList.add(this.itemClass);
    rowElement.style.flex = `${this.width}`;
    rowElement.style.padding = '0';
    rowElement.style.height = '100%';
    this.rowRenderer(rowElement, rowData);
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
      this.element.classList.remove(this.ascendingSortClass);
      this.element.classList.add(this.descendingSortClass);
    } else {
      this.element.classList.remove(this.descendingSortClass);
      this.element.classList.add(this.ascendingSortClass);
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


class Row extends DraggableMixin(DroppableMixin(Element)) {
  /**
   * An row element for use in a Table.
   */
  constructor(data, columns){
    super();

    this.data = data || {};
    this.columns = columns || [];
    this.className = 'row';
    this.hidden = false;

    // Event callbacks
    this.onClick = null;
    this.onDblClick = null;

    this.render();
  }

  // getters

  static get type(){
    return 'div';
  }

  static get dataTransferType(){
    return "text/table-rows";
  }

  get data(){
    return this._data || {};
  }

  get columns(){
    return this._columns || [];
  }

  get hidden(){
    return this._hidden;
  }

  // setters

  set data(value){
    this._data = value;
    this.render();
  }

  set columns(value){
    this._columns = value;
    this.render();
  }

  set hidden(value){
    this._hidden = value;
  }

  render(){
    super.render();
    this.element.style.display = 'flex';

    for (let column of this.columns){
      if (column.visible){
        let td = column.renderRow(this.data);
        this.element.appendChild(td);
      }
    }

    this.element.onclick = (event) => {
      return this.onClick && this.onClick(this, event);
    };
    this.element.ondblclick = (event) => {
      return this.onDblClick && this.onDblClick(this, event);
    };

    return this.element;
  }
}


class Table extends DroppableMixin(Element) {
  /**
   * An interactive table element.
   */
  constructor(columns, selectMultiple){
    super();

    this.header = document.createElement('div');
    this.body = document.createElement('div');

    this._element.appendChild(this.header);
    this._element.appendChild(this.body);

    this.className = 'table';
    this._headerClassName = 'header';
    this._bodyClassName = 'body';
    this._rowClassName = 'row';
    this._selectedRowClassName = 'selected';

    this.header.className = this._headerClassName;
    this.body.className = this._bodyClassName;

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

    this.renderHeader();

    if (columns){
      this.columns = columns;
    }
  }

  // getters

  static get type(){
    return 'div';
  }

  static get rowClass(){
    return Row;
  }

  get rows(){
    return this._rows.slice();
  }

  get columns(){
    return this._columns;
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
    return new Set(this._selectedRows);  // Make copy
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

  set defaultSortFunc(value){
    this._defaultSortFunc = value;
  }

  set rowClassName(className){
    if (this._rowClassName){
      for (let row of this._rows) {
        row.classList.remove(className);
      }
    }
    if (className){
      for (let row of this._rows){
        row.classList.add(className);
      }
    }
    this._rowClassName = className;
  }

  set selectedRowClass(className){
    if (this._selectedRowClassName){
      for (let row of this._selectedRows) {
        row.element.classList.remove(this._selectedRowClassName);
      }
    }
    if (className){
      for (let row of this._selectedRows){
        row.element.classList.add(className);
      }
    }

    this._selectedRowClassName = className;
  }

  set selectMultiple(value){
    this._selectMultiple = value;
    this.toggleRowSelection(null);
  }

  set selectedRows(value){
    let oldRows = new Set(this._selectedRows); // Make copy
    this._selectedRows = new Set(value);  // Make sure set
    this._onSelectedRowsChange(this._selectedRows, oldRows);
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
    for (let column of this._columns){
      column.clearSort();
    }

    if (this._defaultSortFunc){
      data.sort(this._defaultSortFunc);
    }

    this.addRows(data);

    if (this.onDataChanged){
      this.onDataChanged(data);
    }
  }

  clone(){
    let columnsCopy = [];
    for (let column of this._columns){
      columnsCopy.push(column.clone());
    }
    return new this.constructor(columnsCopy, this._selectMultiple);
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


  renderHeader(){
    while (this.header.firstChild) {
      this.header.removeChild(this.header.firstChild);
    }

    let headerRow = document.createElement('div');
    headerRow.className = this._rowClassName;
    headerRow.style.display = 'flex';

    for (let column of this._columns){
      if (column.visible){
        headerRow.appendChild(column.element);
      }
    }

    this.header.appendChild(headerRow);
  }

  addRows(data){
    this._rows = [];

    for (let rowData of data){
      let row = new this.constructor.rowClass(rowData, this._columns);
      row.onClick = this._onRowClick.bind(this);
      row.onDblClick = this._onRowDblClick.bind(this);
      row.element.oncontextmenu = (event) => {
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
      row.onDragStart = (event) => {
        this._onRowDrag(row, event);
      };

      row.className = this._rowClassName;

      this._rows.push(row);
    }

    this.toggleRowSelection(null);

    if (this.onRowsChanged){
      this.onRowsChanged(this._rows);
    }

    this.renderRows();
  }

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


  toggleRowSelection(rowElement, selectMultiple, includeBetween) {
    /* Toggles the selection of a row. The argument can either be a row element in
     * the browser or null. If null it will deselect all rows. A selected event is
     * fired on the row element when a row is first selected and deselect events
     * are similarly fired when its deselected. */
    let oldRows = new Set(this._selectedRows);  // Make copy

    // Initialize new rows. If selectMultiple is true, we include the old selection.
    let newRows;
    if (selectMultiple){
      newRows = new Set(oldRows);
    } else {
      newRows = new Set();
    }

    // If only the toggled rowElement was selected before we remove it. Otherwise we add it.
    if (!includeBetween && oldRows.has(rowElement)){
      newRows.delete(rowElement);
    }else if (rowElement !== null){
      newRows.add(rowElement);
    }

    // Selects the rows between the previously selected rows and the toggled row if
    // includeBetween and selectMultiple are true.
    if (selectMultiple && includeBetween && oldRows.size > 0){
      let sliceIndex;
      let sectionIndex = this._rows.indexOf(rowElement);
      for (let row of oldRows){
        let index = this._rows.indexOf(row);
        if (!sliceIndex || Math.abs(index - sectionIndex) < Math.abs(sliceIndex - sectionIndex)){
          sliceIndex = index;
        }
      }
      let start = Math.min(sliceIndex, sectionIndex) + 1;
      let end = Math.max(sliceIndex, sectionIndex);
      let rowsBetween = this._rows.slice(start, end);
      for (let row of rowsBetween){
        if (this._showHidden || !row.hidden) {
          newRows.add(row);
        }
      }
    }

    this.selectedRows = newRows;
  }
}


export {Column, Table}
