import { Writable, writable } from "svelte/store";
import type Grid from ".";
import Row from "./row";
import { ColumnLayout, gridSize } from "./rowLayouts";

export default class Column {
  public width: Writable<Required<ColumnLayout>>;

  static create(row: Row, width: Required<ColumnLayout>) {
    const node = row.gridManager.editor.dom.create("div", {
      class: "cgb-col",
    });
    row.gridManager.editor.dom.add(row.node, node);
    const innerNode = row.gridManager.editor.dom.add(node, "div", {
      contenteditable: true,
      class: "cgb-col-inner",
    });
    return new Column(row.gridManager, width, node, innerNode);
  }

  static import(grid: Grid, node: HTMLElement, width: Required<ColumnLayout>) {
    let innerNode: HTMLElement | null = node.querySelector(
      ":scope > .cgb-col-inner"
    );
    if (!innerNode) {
      console.error("Column node has no inner node");
      innerNode = grid.editor.dom.create("div", {
        contenteditable: true,
        class: "cgb-col-inner",
      });
      grid.editor.dom.add(node, innerNode);
    }
    grid.editor.dom.setAttrib(innerNode, "contenteditable", "true");
    return new Column(grid, width, node, innerNode);
  }

  constructor(
    public gridManager: Grid,
    width: Required<ColumnLayout>,
    public node: HTMLElement,
    public innerNode: HTMLElement
  ) {
    this.width = writable(width);
    this.width.subscribe((width) => {
      this.gridManager.editor.dom.removeAllAttribs(this.node);
      this.gridManager.editor.dom.addClass(
        this.node,
        `cgb-col col-xs-${width.xs} col-sm-${width.sm} col-md-${width.md} col-lg-${width.lg}`
      );
    });
    // If the column is empty, add a hidden placeholder (TinyMCE will remove it on save otherwise)
    if (this.gridManager.editor.dom.isEmpty(this.innerNode)) {
      this.gridManager.editor.dom.add(
        this.innerNode,
        "div",
        {
          class: "cgb-empty-placeholder",
          style: "display: none",
          contenteditable: false,
        },
        "&nbsp;"
      );
    }
    // Bind to clicks and move the focus
    this.gridManager.editor.dom.bind(this.node, "click", () => {
      //Move selection if we need to
      if (
        !this.innerNode.contains(this.gridManager.editor.selection.getNode())
      ) {
        if (!this.node.contains(this.innerNode)) {
          // Re-add it if it was deleted
          // Remove bogus nodes
          this.gridManager.editor.dom.remove(
            Array.from(this.node.querySelectorAll(":scope *[data-mce-bogus]"))
          );
          this.gridManager.editor.dom.add(this.node, this.innerNode);
        }
        this.gridManager.editor.selection.setCursorLocation(this.innerNode, 0);
      }
    });
  }
}
