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
  public rows: Writable<Row[]> = writable([]);

  private _start: HTMLElement;

  public static create(
    state: stateObject,
    editor: Editor = window.tinymce.activeEditor,
    atCursor = false
  ) {
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
      const inGrid = editor.selection.getNode().closest(".canvas-grid-editor");
      if (inGrid) {
        editor.dom.insertAfter(gridRoot, inGrid);
      } else {
        editor.dom.add(editor.selection.getNode(), gridRoot);
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
    // If ID Already set, use that instead of generating a new one
    if (this.gridRoot.dataset.cgeId) this.id = this.gridRoot.dataset.cgeId;
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
    this.editor.dom.bind(this.gridRoot, "click", (e) => {
      if (e.target.closest(".cgb-col")) return;
      this.state.showInterface.set(true);
      const changeHandler = (e2: any) => {
        if (
          e2.element !== this.gridRoot &&
          e2.element.tagName !== "BODY" && //Fix for Firefox
          !e2.element.closest(".canvas-grid-editor")
        ) {
          this.state.showInterface.set(false);
          this.editor.off("NodeChange", changeHandler);
        }
      };
      this.editor.on("NodeChange", changeHandler);
      e.preventDefault();
      return false;
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

  public checkLayout() {
    console.log("Checking layout");
    // Check if all rows have the layouts they should, updating if not
    this.rows.update((rows) => {
      rows.forEach((row) => {
        row.checkLayout();
      });
      return rows;
    });
  }

  public subscribe = this.rows.subscribe;
}

export default Grid;
