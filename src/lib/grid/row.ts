import { derived, get, Writable, writable } from "svelte/store";
import GridManager from ".";
import Column from "./column";
import { RowLayout, rowTemplates } from "./rowLayouts";

export default class Row {
  public node: Element;
  public gridManager: GridManager;
  public columns: Writable<Column[]> = writable([]);

  constructor(
    gridManager: GridManager,
    layout: RowLayout = rowTemplates["1"],
    insertAfter?: Element
  ) {
    this.gridManager = gridManager;
    const newNode = this.gridManager.editor.dom.create("div", {
      class: "grid-row",
    });
    if (insertAfter)
      this.node = this.gridManager.editor.dom.insertAfter(newNode, insertAfter);
    else {
      this.node = this.gridManager.editor.dom.add(
        this.gridManager.gridRoot,
        newNode
      );
    }
    this.setLayout(layout);
  }

  setLayout(layout: RowLayout) {
    const columns = get(this.columns);
    for (let i = 0; i < layout.cols.length; i++) {
      if (i > columns.length - 1)
        columns.push(new Column(this, layout.cols[i]));
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
