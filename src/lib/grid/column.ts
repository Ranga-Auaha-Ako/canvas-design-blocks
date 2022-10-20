import { Writable, writable } from "svelte/store";
import type GridManager from ".";
import Row from "./row";
import { ColumnLayout, gridSize } from "./rowLayouts";

export default class Column {
  public width: Writable<Required<ColumnLayout>>;

  static create(row: Row, width: Required<ColumnLayout>) {
    const node = row.gridManager.editor.dom.create("div", {
      class: "col",
    });
    row.gridManager.editor.dom.add(row.node, node);
    const innerNode = row.gridManager.editor.dom.add(node, "div", {
      contenteditable: true,
      class: "cgb-col-inner",
    });
    return new Column(row.gridManager, width, node, innerNode);
  }

  static import(
    gridManager: GridManager,
    node: Element,
    width: Required<ColumnLayout>
  ) {
    const innerNode = node.children[0];
    gridManager.editor.dom.setAttrib(innerNode, "contenteditable", "true");
    return new Column(gridManager, width, node, innerNode);
  }

  constructor(
    public gridManager: GridManager,
    width: Required<ColumnLayout>,
    public node: Element,
    public innerNode: Element
  ) {
    this.width = writable(width);
    this.width.subscribe((width) => {
      this.gridManager.editor.dom.removeAllAttribs(this.node);
      this.gridManager.editor.dom.addClass(
        this.node,
        `col-xs-${width.xs} col-sm-${width.sm} col-md-${width.md} col-lg-${width.lg}`
      );
    });
  }
  delete() {
    this.gridManager.editor.dom.remove(this.node);
    // this.row.columns.update((columns) =>
    //   columns.filter((column) => column !== this)
    // );
  }
}
