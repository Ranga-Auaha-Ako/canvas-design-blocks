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
  private _isGrid = writable(false);
  public isGrid = derived(this._isGrid, (v) => v);
  public gridRoot: Element;

  private _start: Element;

  public rows: Writable<Row[]> = writable([]);

  constructor(public state: { editorVisible: Writable<boolean> }) {
    this.editor = window.tinymce.activeEditor;
    const root = this.editor.dom.getRoot();
    // Three situations might occur:
    // -------- No need to make a new grid:
    //   1. Page has already been converted to grid
    // -------- Need to make a new grid:
    //   2. Page is empty (we can safely add the grid to the page)
    //   3. Page has content which can be converted to grid

    // 1. Page has already been converted to grid
    const foundGridRoot = Array.from(root.children).find((e) =>
      e.classList.contains("canvas-grid-editor")
    );
    if (foundGridRoot) {
      this.gridRoot = foundGridRoot;
      const foundStart = Array.from(this.gridRoot.children).find((e) =>
        e.classList.contains("cge-start")
      );
      if (!foundStart)
        throw new Error("Grid root does not contain start element");
      this._isGrid.set(true);
      this._start = foundStart; // Should be a hidden div
      // Get rows
      const rows = Array.from(this.gridRoot.children).filter((e) =>
        e.classList.contains("grid-row")
      );
      this.rows.set(rows.map((row) => Row.import(this, row)));
      this.bindEvents();
      return;
    }
    // -------- Need to make a new grid:
    this.gridRoot = this.editor.dom.create("div", {
      class: "canvas-grid-editor",
    });
    this._start = this.editor.dom.add(
      this.gridRoot,
      "div",
      {
        class: "cge-start",
        style: "display: none;",
      },
      `--Canvas Grid Builder Markup v1.0--`
    );
    this.bindEvents();
    // 2. Page is empty (we can safely add the grid to the page)
    if (this.editor.dom.isEmpty(root)) {
      // Clear any empty paragraphs
      this.editor.dom.remove(Array.from(root.children));
      // Add grid DOM to root
      this.editor.dom.add(root, this.gridRoot);
      this._isGrid.set(true);
      // Add a row to start
      this.addRow(rowTemplates["1"]);
      return;
    }
    // 3. Page has content which can be converted to grid
    //  - In this case, we need to ask the user if they want to convert the page.
    //  - Wait for MakeGrid to be called.
  }

  public bindEvents() {
    this.editor.dom.setAttrib(this.gridRoot, "contenteditable", "false");
    this.editor.dom.bind(this.gridRoot, "click", (e) => {
      if (!(e.target === this.gridRoot)) return;
      this.state.editorVisible.set(true);
      const changeHandler = (e2: any) => {
        if (
          e2.element !== this.gridRoot &&
          e2.element.tagName !== "BODY" && //Fix for Firefox
          !e2.element.closest(".canvas-grid-container")
        ) {
          this.state.editorVisible.set(false);
          this.editor.off("NodeChange", changeHandler);
          // this.editor.off("blur", changeHandler);
        }
      };
      this.editor.once("NodeChange", changeHandler);
      // this.editor.once("blur", changeHandler);
    });
  }

  public makeGrid() {
    if (get(this.isGrid)) return;
    // Get contents of root and move it into grid
    const root = this.editor.dom.getRoot();
    const rootChildren = Array.from(root.children);
    this.editor.dom.remove(rootChildren);
    // Add row
    const row = this.addRow(rowTemplates["1"]);
    rootChildren.forEach((child) => {
      row.updateCol(child, 0, false);
    });
    // Append grid to root
    this.editor.dom.add(root, this.gridRoot);
    this._isGrid.set(true);
    console.log("Grid initialized");
  }

  public addRow(layout?: RowLayout, index?: number) {
    let row: Row;
    if (index === undefined) row = Row.create(this, layout);
    else {
      let insertAfter;
      if (index === 0) insertAfter = this._start;
      else insertAfter = this.gridRoot.children[index];
      row = Row.create(this, layout, insertAfter);
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
