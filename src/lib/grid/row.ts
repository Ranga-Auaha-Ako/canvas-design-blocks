import { derived, get, Writable, writable } from "svelte/store";
import GridManager from ".";
import Column from "./column";
import { ColumnLayout, gridSize, RowLayout, rowTemplates } from "./rowLayouts";

export default class Row {
  public static create(
    gridManager: GridManager,
    layout: RowLayout = rowTemplates["1"],
    insertAfter?: Element
  ) {
    const newNode = gridManager.editor.dom.create("div", {
      class: "grid-row",
    });
    if (insertAfter) {
      gridManager.editor.dom.insertAfter(newNode, insertAfter);
      return new Row(gridManager, layout, newNode);
    } else {
      gridManager.editor.dom.add(gridManager.gridRoot, newNode);
      return new Row(gridManager, layout, newNode);
    }
  }

  public static import(gridManager: GridManager, node: Element) {
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
    public gridManager: GridManager,
    layout: RowLayout,
    public node: Element,
    public columns: Writable<Column[]> = writable([])
  ) {
    this.gridManager = gridManager;
    this.node = node;
    this.setLayout(layout);
  }

  setLayout(layout: RowLayout) {
    const columns = get(this.columns);
    for (let i = 0; i < layout.cols.length; i++) {
      if (i > columns.length - 1)
        columns.push(Column.create(this, layout.cols[i]));
      else columns[i].width.set(layout.cols[i]);
    }
    // If there are more columns than the new layout, delete them
    while (columns.length > layout.cols.length) {
      columns[columns.length - 1].delete();
    }
  }

  updateCol(content: Element, col = 0, replaceContents = false) {
    const columns = get(this.columns);
    if (replaceContents) {
      const existingChildren = Array.from(columns[col].node.children);
      existingChildren.forEach((child) => {
        this.gridManager.editor.dom.remove(child);
      });
    }
    this.gridManager.editor.dom.add(columns[col].node, content);
  }
}
