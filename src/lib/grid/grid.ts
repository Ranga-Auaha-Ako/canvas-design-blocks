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
import { nanoid } from "nanoid";
import { stateObject } from "./gridManager";

export class Grid implements Readable<Row[]> {
  public readonly id = nanoid();
  public readonly selected: Writable<boolean | string> = writable(false);
  public rows: Writable<Row[]> = writable([]);

  private _start: HTMLElement;

  public static create(
    state: stateObject,
    editor: Editor = window.tinymce.activeEditor,
    atCursor = false
  ) {
    debugger;
    // Creates a new grid at the specified location
    const gridRoot = editor.dom.create("div", {
      class: "canvas-grid-editor",
    });
    const _start = editor.dom.add(
      gridRoot,
      "div",
      {
        class: "cge-start",
        style: "display: none;",
      },
      `--Canvas Grid Builder Markup v1.0--`
    );
    // Add grid to page
    if (atCursor) {
      const insertNode = editor.selection.getNode();
      const inGrid = insertNode.closest(".canvas-grid-editor");
      if (inGrid) {
        editor.dom.insertAfter(gridRoot, inGrid);
      } else if (!editor.dom.isBlock(insertNode)) {
        editor.dom.insertAfter(gridRoot, insertNode);
      } else {
        editor.dom.add(insertNode, gridRoot);
      }
    } else editor.dom.add(editor.dom.getRoot(), gridRoot);
    // Create grid instance
    return new this(state, editor, gridRoot);
  }

  public static import(
    state: stateObject,
    editor: Editor = window.tinymce.activeEditor,
    gridRoot: HTMLElement
  ) {
    const grid = new this(state, editor, gridRoot, []);
    // Get rows
    const rows = Array.from(gridRoot.children).filter((e) =>
      e.classList.contains("grid-row")
    ) as HTMLElement[];
    const rowInsts = rows.map((row) => Row.import(grid, row));
    grid.rows.set(rowInsts);
    return grid;
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public gridRoot: HTMLElement,
    rows?: Row[]
  ) {
    // Don't do this - duplicate grids might have duplicate IDS so always safer to make a new one
    // // If ID Already set, use that instead of generating a new one
    // if (this.gridRoot.dataset.cgeId) this.id = this.gridRoot.dataset.cgeId;
    // Find start element
    const foundStart = Array.from(gridRoot.children).find((e) =>
      e.classList.contains("cge-start")
    ) as HTMLElement | undefined;
    if (!foundStart)
      throw new Error("Grid root does not contain start element");
    this._start = foundStart; // Should be a hidden div
    // Set up rows
    if (rows) this.rows.set(rows);
    else this.addRow(rowTemplates["1"]);
    // Bind events to grid
    this.bindEvents();
    // Set ID of grid
    this.gridRoot.dataset.cgeId = this.id;
  }

  public bindEvents() {
    // Monitor the active row
    this.editor.on("nodeChange", ({ element }: { element: HTMLElement }) => {
      const rowNode = element.closest(".grid-row");
      if (rowNode) {
        const row = get(this.rows).find((r) => r.node === rowNode);
        if (row) {
          this.selected.set(row.id);
          return;
        }
      } else {
        if (element === this.gridRoot) {
          this.selected.set(true);
          return;
        }
      }
      this.selected.set(false);
    });

    // Prevent accidental deletion of grid
    this.editor.dom.setAttrib(this.gridRoot, "contenteditable", "false");
  }

  public destroy() {
    this.rows.update((row) => {
      row.forEach((r) => r.delete(true));
      return [];
    });
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

export default Grid;
