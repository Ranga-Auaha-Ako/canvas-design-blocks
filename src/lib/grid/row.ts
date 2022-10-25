import { derived, get, Writable, writable } from "svelte/store";
import Grid from ".";
import Column from "./column";
import { ColumnLayout, gridSize, RowLayout, rowTemplates } from "./rowLayouts";
import { nanoid } from "nanoid";
import confirmDialog from "../confirmDialog";

export default class Row {
  public readonly id = nanoid();

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

  public static import(gridManager: Grid, node: Element) {
    // Get Row Layout
    const columnNodes = Array.from(node.children).filter((e) =>
      Array.from(e.classList).find((c) => c.startsWith("col-"))
    );
    const rowLayout = RowLayout.getLayout(columnNodes);
    const columns = columnNodes.map((colNode, index) => {
      return Column.import(gridManager, colNode, rowLayout.cols[index]);
    });
    const row = new Row(gridManager, rowLayout, node, writable(columns));
    return row;
  }

  constructor(
    public gridManager: Grid,
    layout: RowLayout,
    public node: Element,
    public columns: Writable<Column[]> = writable([])
  ) {
    this.setLayout(layout);
  }

  async setLayout(layout: RowLayout) {
    const columns = get(this.columns);
    // Find out if we need to delete any
    const toDelete = columns.slice(layout.cols.length);
    const colsWithContent = toDelete.filter(
      (c) => !c.gridManager.editor.dom.isEmpty(c.node)
    );
    if (colsWithContent.length) {
      const userConfirm = await confirmDialog(
        this.gridManager.editor,
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
    if (!this.gridManager.editor.dom.isEmpty(this.node)) {
      const userConfirm =
        force || (await confirmDialog(this.gridManager.editor));
      if (!userConfirm) {
        console.log("Cancelled!");
        return false;
      }
    }
    this.gridManager.editor.dom.remove(this.node);
    this.gridManager.rows.update((rows) =>
      rows.filter((r) => r.id !== this.id)
    );
    return true;
  }

  deleteCol(column: number | Column) {
    if (typeof column === "number") column = get(this.columns)[column];
    this.gridManager.editor.dom.remove(column.node);
    this.columns.update((columns) => columns.filter((c) => c !== column));
  }

  updateCol(content: Element, col = 0, replaceContents = false) {
    const columns = get(this.columns);
    if (replaceContents) {
      const existingChildren = Array.from(columns[col].innerNode.children);
      existingChildren.forEach((child) => {
        this.gridManager.editor.dom.remove(child);
      });
    }
    this.gridManager.editor.dom.add(columns[col].innerNode, content);
  }
}
