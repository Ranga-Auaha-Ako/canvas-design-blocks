import {
  derived,
  get,
  readable,
  Subscriber,
  Unsubscriber,
  writable,
} from "svelte/store";
import type { Writable, Readable } from "svelte/store";
import type { Editor } from "tinymce";
import Row from "./row";
import { RowLayout, rowTemplates } from "./rowLayouts";

export default class implements Readable<Row[]> {
  public editor: Editor;
  private _isInitialized = writable(false);
  public isInitialized = derived(this._isInitialized, (v) => v);
  public gridRoot: Element;

  private _start: Element;

  public rows: Writable<Row[]> = writable([]);

  constructor() {
    this.editor = window.tinymce.activeEditor;
    const root = this.editor.dom.getRoot();
    if (root.children[0].classList.contains("canvas-grid-editor")) {
      // Detect if grid already exists by checking top level element
      this.gridRoot = root.children[0];
      this._isInitialized.set(true);
      this._start = this.gridRoot.children[0];
      return;
    }
    // Grid doesn't exist already, create it
    this.gridRoot = this.editor.dom.create("div", {
      class: "canvas-grid-editor",
    });
    this._start = this.editor.dom.add(this.gridRoot, "div", {
      class: "cge-start",
      style: "display: none;",
    });
    if (this.editor.dom.isEmpty(root)) {
      // If root is empty, append grid and call it done.
      this.editor.dom.add(root, this.gridRoot);
      this._isInitialized.set(true);
      return;
    }
  }

  public initialize() {
    if (get(this.isInitialized)) return;
    // Get contents of root and move it into grid
    const root = this.editor.dom.getRoot();
    const rootChildren = Array.from(root.children);
    this.editor.dom.remove(rootChildren);
    // Add row
    const row = this.addRow(rowTemplates["1"]);
    rootChildren.forEach((child) => {
      row.updateCol(child, 0, true);
    });
    // Append grid to root
    this.editor.dom.add(root, this.gridRoot);
    this._isInitialized.set(true);
    console.log("Grid initialized");
  }

  public addRow(layout?: RowLayout, index?: number) {
    let row: Row;
    if (index === undefined) row = new Row(this, layout);
    else {
      let insertAfter;
      if (index === 0) insertAfter = this._start;
      else insertAfter = this.gridRoot.children[index];
      row = new Row(this, layout, insertAfter);
    }
    this.rows.update((rows) => {
      if (index === undefined) rows.push(row);
      else rows.splice(index, 0, row);
      return rows;
    });
    return row;
  }

  public subscribe = this.rows.subscribe;
}
