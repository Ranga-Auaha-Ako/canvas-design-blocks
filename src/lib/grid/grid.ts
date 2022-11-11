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
import confirmDialog from "$lib/util/confirmDialog";

export class Grid implements Readable<Row[]> {
  public static gridMarkupVersion = "1.0.0";
  public readonly id = nanoid();
  public readonly selected: Writable<boolean | string> = writable(false);
  public rows: Writable<Row[]> = writable([]);

  public static migrate(grid: Grid) {
    if (grid.gridRoot.dataset.cgbVersion === Grid.gridMarkupVersion) return;
    console.log(
      `Migrating grid from ${grid.gridRoot.dataset.cgbVersion || "alpha"} to v${
        Grid.gridMarkupVersion
      }`
    );
    // SINCE alpha: Columns might have direct text decendants of innernode. This is no longer allowed, so we need to wrap them in a paragraph
    if (grid.gridRoot.dataset.cgeVersion === undefined) {
      get(grid).forEach((row) => {
        get(row.columns).forEach((col) => {
          col.checkChildren();
        });
      });
    }
    // Migrate row to new version
    grid.gridRoot.dataset.cgbVersion = Grid.gridMarkupVersion;
  }

  public static create(
    state: stateObject,
    editor: Editor = window.tinymce.activeEditor,
    atCursor = false
  ) {
    // Creates a new grid at the specified location
    const gridRoot = editor.dom.create("div", {
      class: "canvas-grid-editor",
      "data-cgb-version": Grid.gridMarkupVersion,
    });
    // Add grid to page
    if (atCursor) {
      const insertNode = editor.selection.getNode();
      const inGrid = insertNode.closest(".canvas-grid-editor");
      if (inGrid) {
        editor.dom.insertAfter(gridRoot, inGrid);
      } else if (
        insertNode.nodeName === "BODY" ||
        insertNode.closest("body") === null
      ) {
        editor.dom.add(editor.dom.getRoot(), gridRoot);
      } else if (!editor.dom.isBlock(insertNode)) {
        //  If the cursor is in a non-block element, insert the grid after the element
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
    // Migrate if needed
    Grid.migrate(grid);
    return grid;
  }

  constructor(
    public state: stateObject,
    public editor: Editor = window.tinymce.activeEditor,
    public gridRoot: HTMLElement,
    rows?: Row[]
  ) {
    // Don't do this - duplicate grids might have duplicate IDS so always safer to make a new one

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
    this.gridRoot.parentElement?.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Backspace" || e.key === "Delete") {
          let willDeleteElem = false;
          const selectNode = this.editor.selection.getNode() as HTMLElement;
          if (e.key === "Backspace") {
            if (
              selectNode.dataset.mceCaret === "after" &&
              selectNode.previousSibling === this.gridRoot
            )
              willDeleteElem = true;
          } else {
            if (
              selectNode.dataset.mceCaret === "before" &&
              selectNode.nextSibling === this.gridRoot
            )
              willDeleteElem = true;
          }
          if (get(this.selected) === true || willDeleteElem) {
            e.preventDefault();
            e.stopPropagation();
            confirmDialog(
              this.editor,
              "Delete Grid?",
              "Are you sure you want to delete this grid?"
            ).then((confirm) => {
              if (confirm) this.destroy();
            });
            return false;
          }
        }
      },
      {
        capture: true,
      }
    );
  }

  public checkRows() {
    // Trigger a check on all rows
    get(this.rows).forEach((row) => row.checkChildren());
  }

  public destroy() {
    this.rows.update((row) => {
      row.forEach((r) => r.delete(true));
      return [];
    });
  }

  public addRow(layout?: RowLayout, index?: number) {
    let row: Row;
    const rows = get(this.rows);
    if (index === undefined) {
      row = Row.create(this, layout);
    } else {
      if (index === 0) {
        row = Row.create(this, layout, this.gridRoot, "afterbegin");
      } else {
        row = Row.create(
          this,
          layout,
          this.gridRoot.children[index],
          "afterend"
        );
      }
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
