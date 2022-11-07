import { Writable, writable } from "svelte/store";
import type Grid from "./grid";
import Row from "./row";
import { ColumnLayout, gridSize } from "./rowLayouts";

export default class Column {
  public width: Writable<Required<ColumnLayout>>;
  public getTextTarget() {
    const foundParagraphs = this.innerNode.querySelectorAll(
      ":scope > p:not([data-mce-caret]):not([data-mce-bogus])"
    );
    let textTarget;
    if (!foundParagraphs.length)
      textTarget = this.parentGrid.editor.dom.add(this.innerNode, "p");
    else textTarget = foundParagraphs[foundParagraphs.length - 1];
    if (this.parentGrid.editor.dom.isEmpty(textTarget)) {
      textTarget.innerHTML = "";
      this.parentGrid.editor.dom.add(textTarget, "br", {
        "data-mce-bogus": "1",
      });
    }
    return foundParagraphs[foundParagraphs.length - 1];
  }

  static create(row: Row, width: Required<ColumnLayout>) {
    const node = row.parentGrid.editor.dom.create("div", {
      class: "cgb-col",
    });
    row.parentGrid.editor.dom.add(row.node, node);
    const innerNode = row.parentGrid.editor.dom.add(node, "div", {
      contenteditable: true,
      class: "cgb-col-inner",
    });
    return new Column(row.parentGrid, width, node, innerNode);
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
    public parentGrid: Grid,
    width: Required<ColumnLayout>,
    public node: HTMLElement,
    public innerNode: HTMLElement
  ) {
    this.width = writable(width);
    this.width.subscribe((width) => {
      this.parentGrid.editor.dom.removeAllAttribs(this.node);
      this.parentGrid.editor.dom.addClass(
        this.node,
        `cgb-col col-xs-${width.xs} col-sm-${width.sm} col-md-${width.md} col-lg-${width.lg}`
      );
    });
    // If the column is empty, add a hidden placeholder (TinyMCE will remove it on save otherwise)
    if (this.parentGrid.editor.dom.isEmpty(this.innerNode)) {
      console.log("added placeholder");
      this.parentGrid.editor.dom.add(
        this.innerNode,
        "div",
        {
          class: "cgb-empty-placeholder",
          style: "display: none",
          contenteditable: false,
        },
        "&nbsp;"
      );
      this.getTextTarget();
    }
    // Bind to clicks and move the focus
    this.parentGrid.editor.dom.bind(this.node, "click", () => {
      // If the column uses the old format (has text as direct decendant rather than in a paragraph), move it into a paragraph
      const textNodes = [
        ...this.node.childNodes,
        ...this.innerNode.childNodes,
      ].filter((n) => n.nodeType === Node.TEXT_NODE);
      textNodes.forEach((n) => {
        // Add to new paragraph
        n.textContent &&
          this.parentGrid.editor.dom.add(
            this.innerNode,
            "p",
            {},
            n.textContent
          );
        // Remove old text node
        this.parentGrid.editor.dom.remove(n);
      });

      //Move selection if we need to.
      if (
        !this.innerNode.contains(this.parentGrid.editor.selection.getNode())
      ) {
        const textTarget = this.parentGrid.editor.dom.add(
          this.getTextTarget(),
          "span"
        );
        if (textTarget) this.parentGrid.editor.selection.select(textTarget);
      }
    });
  }
}
