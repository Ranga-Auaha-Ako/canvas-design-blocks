import { Writable, writable } from "svelte/store";
import Row from "./row";
import { ColumnLayout } from "./rowLayouts";

export default class Column {
  public node: Element;
  public row: Row;
  public width: Writable<Required<ColumnLayout>>;

  constructor(row: Row, width: Required<ColumnLayout>) {
    this.row = row;
    this.node = this.row.gridManager.editor.dom.create("div", {
      class: "col",
    });
    this.row.gridManager.editor.dom.add(this.row.node, this.node);
    this.row.gridManager.editor.dom.add(this.node, "p", {}, "<br/>");
    this.width = writable(width);
    this.width.subscribe((width) => {
      this.row.gridManager.editor.dom.removeAllAttribs(this.node);
      this.row.gridManager.editor.dom.addClass(
        this.node,
        `col-xs-${width.xs} col-sm-${width.sm} col-md-${width.md} col-lg-${width.lg}`
      );
    });
  }
  delete() {
    this.row.gridManager.editor.dom.remove(this.node);
    this.row.columns.update((columns) =>
      columns.filter((column) => column !== this)
    );
  }
}
