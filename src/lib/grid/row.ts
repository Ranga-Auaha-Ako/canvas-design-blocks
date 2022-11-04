import { derived, get, Writable, writable } from "svelte/store";
import Grid from "./grid";
import Column from "./column";
import { ColumnLayout, gridSize, RowLayout, rowTemplates } from "./rowLayouts";
import { nanoid } from "nanoid";
import confirmDialog from "$lib/util/confirmDialog";
import deriveWindow from "$lib/util/deriveWindow";

export default class Row {
  public readonly id = nanoid();
  public readonly selected = writable(false);
  get index() {
    return get(this.parentGrid).findIndex((r) => r.id === this.id);
  }

  public static create(
    grid: Grid,
    layout: RowLayout = rowTemplates["1"],
    insertAfter?: Element
  ) {
    const newNode = grid.editor.dom.create("div", {
      class: "grid-row",
      // "data-cgb-row-id": `${nanoid()}`,
    });
    if (insertAfter) {
      grid.editor.dom.insertAfter(newNode, insertAfter);
      return new Row(grid, layout, newNode);
    } else {
      grid.editor.dom.add(grid.gridRoot, newNode);
      return new Row(grid, layout, newNode);
    }
  }

  public static import(parentGrid: Grid, node: HTMLElement) {
    // Get Row Layout
    const columnNodes: HTMLElement[] = (
      Array.from(node.children) as HTMLElement[]
    ).filter((e) => Array.from(e.classList).find((c) => c.startsWith("col-")));
    const rowLayout = RowLayout.getLayout(columnNodes);
    const columns = columnNodes.map((colNode, index) => {
      return Column.import(parentGrid, colNode, rowLayout.cols[index]);
    });
    const row = new Row(parentGrid, rowLayout, node, writable(columns));
    return row;
  }

  constructor(
    public parentGrid: Grid,
    layout: RowLayout,
    public node: HTMLElement,
    public columns: Writable<Column[]> = writable([])
  ) {
    this.setLayout(layout);
  }

  async setLayout(layout: RowLayout) {
    const columns = get(this.columns);
    // Find out if we need to delete any
    const toDelete = columns.slice(layout.cols.length);
    const colsWithContent = toDelete.filter((c) =>
      c.innerNode.innerText.replace(/[\n\s]+/m, "")
    );
    if (colsWithContent.length) {
      const userConfirm = await confirmDialog(
        this.parentGrid.editor,
        "Update Layout",
        "This row has content in it that will be deleted by removing columns! Are you sure you want to change to this layout?",
        "Yes, change layout"
      );
      if (!userConfirm) {
        return false;
      }
    }
    for (let i = 0; i < layout.cols.length; i++) {
      if (i > columns.length - 1)
        columns.push(Column.create(this, layout.cols[i]));
      else columns[i].width.set(layout.cols[i]);
    }
    this.columns.set(columns);
    // If there are more columns than the new layout, delete them
    toDelete.forEach((col) => {
      this.deleteCol(col);
    });
  }

  async delete(force = false) {
    if (
      get(this.columns).find(
        (c) => c.innerNode.innerText.replace(/[\n\s]+/m, "") // Discard newlines and whitespace
      )
    ) {
      const userConfirm =
        force || (await confirmDialog(this.parentGrid.editor));
      if (!userConfirm) {
        console.log("Cancelled!");
        return false;
      }
    }
    this.parentGrid.editor.dom.remove(this.node);
    this.parentGrid.rows.update((rows) => rows.filter((r) => r.id !== this.id));
    return true;
  }

  deleteCol(column: number | Column) {
    if (typeof column === "number") column = get(this.columns)[column];
    this.parentGrid.editor.dom.remove(column.node);
    this.columns.update((columns) => columns.filter((c) => c !== column));
  }

  updateCol(content: Element, col = 0, replaceContents = false) {
    const columns = get(this.columns);
    if (replaceContents) {
      const existingChildren = Array.from(columns[col].innerNode.children);
      existingChildren.forEach((child) => {
        this.parentGrid.editor.dom.remove(child);
      });
    }
    this.parentGrid.editor.dom.add(columns[col].innerNode, content);
  }
}
