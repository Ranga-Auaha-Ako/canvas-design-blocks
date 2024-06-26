import {
  derived,
  get,
  Readable,
  Unsubscriber,
  Writable,
  writable,
} from "svelte/store";
import Grid from "./grid";
import Column from "./column";
import { ColumnLayout, gridSize, RowLayout, rowTemplates } from "./rowLayouts";
import { nanoid } from "nanoid";
import confirmDialog from "$lib/util/confirmDialog";
import deriveWindow from "$lib/util/deriveWindow";
import MceElement from "$lib/elements/generic/mceElement";
import type { McePopover } from "$lib/elements/generic/popover/popover";
import RowMenu from "$lib/elements/grid/popup/rowMenu.svelte";
import type { Editor } from "tinymce";

import { persisted } from "svelte-persisted-store";
const copyStore = persisted<{ copied: string | null }>(
  "cdb_copy_row",
  { copied: null },
  {
    storage: "session",
    syncTabs: true,
  }
);

export default class Row extends MceElement {
  public selectionMethod: "TinyMCE" | "focus" = "focus";
  public trackInnerText = false;
  public attributes: MceElement["attributes"] = new Map([]);
  public defaultClasses = new Set(["grid-row"]);
  public popover: McePopover;

  // Modify this to be a derived store based only on current element. Do not use parent grid
  public isSelected: Readable<boolean> = derived(this.selected, ($selected) => {
    return $selected.size > 0;
  });

  get index() {
    return get(this.parentGrid).findIndex((r) => r.id === this.id);
  }

  public static columnNodes(node: HTMLElement): HTMLElement[] {
    return (Array.from(node.children) as HTMLElement[]).filter((e) =>
      Array.from(e.classList || []).find((c) => c.startsWith("col-"))
    );
  }
  public static getLayoutFromNode(node: HTMLElement): RowLayout {
    const columnNodes = Row.columnNodes(node);
    return RowLayout.getLayout(columnNodes);
  }
  get colNodes() {
    return Row.columnNodes(this.node);
  }
  public layout;

  public static create(grid: Grid, layout?: RowLayout): Row;
  public static create(
    grid: Grid,
    layout?: RowLayout,
    insertAdjacent?: Element,
    placement?: InsertPosition
  ): Row;
  public static create(
    grid: Grid,
    layout: RowLayout = rowTemplates["1"],
    insertAdjacent?: Element,
    placement: InsertPosition = "afterend"
  ): Row {
    const newNode = grid.editor.dom.create("div");
    if (insertAdjacent) {
      insertAdjacent.insertAdjacentElement(placement, newNode);
      return new Row(grid, layout, newNode);
    } else {
      grid.editor.dom.add(grid.node, newNode);
      return new Row(grid, layout, newNode);
    }
  }

  public static import(parentGrid: Grid, node: HTMLElement) {
    // Remote old ID formats
    if (node.dataset.cgbId) delete node.dataset.cgbId;
    if (node.dataset.cgeId) delete node.dataset.cgeId;
    if (node.dataset.cgbVersion) delete node.dataset.cgbVersion;
    if (node.dataset.cgbContent) delete node.dataset.cgbContent;
    // Get Row Layout
    const rowLayout = Row.getLayoutFromNode(node);
    const columns = Row.columnNodes(node).map((colNode, index) => {
      return Column.import(parentGrid, colNode, rowLayout.cols[index]);
    });
    const row = new Row(parentGrid, rowLayout, node, writable(columns));
    return row;
  }

  constructor(
    public parentGrid: Grid,
    layout: RowLayout,
    public node: HTMLElement,
    public columns: Writable<Column[]> = writable([])
  ) {
    super(node, parentGrid.editor);
    // Start watching for changes in the TinyMCE DOM
    this.setupObserver();

    this.setLayout(layout);
    this.layout = derived(this.columns, ($columns) => {
      return RowLayout.getLayout($columns.map((c) => c.node));
    });
    this.checkChildren();
    this.node.addEventListener("click", () => {
      this.checkChildren;
    });
    this.node.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "F9") {
        this.popover.show(true);
        e.preventDefault();
      }
    });
    // Set up popover
    this.popover = this.setupPopover(RowMenu, { row: this }, "top");
    this.isSelected.subscribe((selected) => {
      if (selected) {
        !this.popover.isActive && this.popover.show();
      } else {
        if (this.popover.isActive) {
          this.popover.hide();
        }
      }
    });
    // let curSel: any;
    // this.isSelected.subscribe(() => {
    //   const par = get(this.parent);
    //   console.log(
    //     "Selected",
    //     Array.from(get(this.selected)),
    //     par !== false ? Array.from(get(this.selected)) : null
    //   );
    // });
    // Row children are always columns or the popover
    columns.subscribe((cols) => {
      this.children.set([...cols, this.popover]);
    });
  }

  async setLayout(layout: RowLayout) {
    const columns = get(this.columns);
    // Find out if we need to delete any
    const toDelete = columns.slice(layout.cols.length);
    const colsWithContent = toDelete.filter((c) =>
      c.innerNode.innerText.replace(/[\n\s]+/m, "")
    );
    if (colsWithContent.length) {
      const userConfirm = await confirmDialog(
        this.parentGrid.editor,
        "Update Layout",
        "This row has content in it that will be deleted by removing columns! Are you sure you want to change to this layout?",
        "Yes, change layout"
      );
      if (!userConfirm) {
        return false;
      }
    }
    for (let i = 0; i < layout.cols.length; i++) {
      if (i > columns.length - 1)
        columns.push(Column.create(this, layout.cols[i], this));
      else columns[i].width.set(layout.cols[i]);
    }
    this.columns.set(columns);
    // If there are more columns than the new layout, delete them
    toDelete.forEach((col) => {
      this.deleteCol(col);
    });
  }

  async delete(force = false) {
    if (
      get(this.columns).find(
        (c) => c.innerNode.innerText.replace(/[\n\s]+/m, "") // Discard newlines and whitespace
      )
    ) {
      const userConfirm =
        force || (await confirmDialog(this.parentGrid.editor));
      if (!userConfirm) {
        console.log("Cancelled!");
        return false;
      }
    }
    // Disconnects watching devices, removes self from DOM.
    super.delete();
    this.parentGrid.rows.update((rows) => rows.filter((r) => r.id !== this.id));
    this.selected.set(new Set());
    return true;
  }

  deleteCol(column: number | Column) {
    if (typeof column === "number") column = get(this.columns)[column];
    this.parentGrid.editor.dom.remove(column.node);
    this.columns.update((columns) => columns.filter((c) => c !== column));
  }

  updateCol(content: Element, col = 0, replaceContents = false) {
    const columns = get(this.columns);
    if (replaceContents) {
      const existingChildren = Array.from(columns[col].innerNode.children);
      existingChildren.forEach((child) => {
        this.parentGrid.editor.dom.remove(child);
      });
    }
    this.parentGrid.editor.dom.add(columns[col].innerNode, content);
  }

  public checkSelf() {
    this.stopObserving();
    // Check if self has been deleted. If so, reinsert into dom
    if (!this.node.parentElement) {
      const position = get(this.parentGrid).findIndex((r) => r.id === this.id);
      if (position == -1) {
        // Uncaught delete!
        this.delete(true);
        return;
      }
      get(this.parentGrid)[position - 1].node.insertAdjacentElement(
        "afterend",
        this.node
      );
    }
    this.startObserving();
  }

  public checkChildren() {
    this.stopObserving();

    let lastMatchedCol: number = 0;
    const colChildren = Array.from(
      this.node.querySelectorAll<HTMLDivElement>("div.cgb-col[data-cdb-id]")
    );
    // Check if our layout has changed
    const newLayout = RowLayout.getLayout(colChildren);
    if (newLayout.id !== get(this.layout).id) {
      this.columns.update((cols) => {
        let newCols: Column[] = [];
        colChildren.forEach((colNode, index) => {
          // See if there's a matching column
          const col = cols.find((c) => c.node === colNode);
          if (col) {
            newCols.push(col);
          } else {
            // Create a new column
            newCols.push(
              Column.import(this.parentGrid, colNode, newLayout.cols[index])
            );
          }
        });
        // Remove any columns that are no longer in the layout
        cols.forEach((col) => {
          if (!newCols.find((c) => c.node === col.node)) {
            debugger;
            col.delete();
          }
        });
        return newCols;
      });
    }
    const cols = get(this.columns);
    const colNodes = cols.map((col) => col.node);

    // Check if any of the children are not column elements
    Array.from(this.node.children).forEach((child) => {
      const window = deriveWindow(child);
      if (window && child instanceof window.HTMLElement) {
        // Allow some nodes to be left in place if the author wants
        if (child.dataset.cgbNoMove === "true") return;

        // Check if the child is a cgb interface or otherwise "bogus" and not delete it
        if (child.dataset.mceBogus) return;

        // Check if the child is an existing column
        const colIndex = colNodes.findIndex((col) => col === child);
        if (colIndex >= 0) {
          lastMatchedCol = colIndex;
          return;
        }
        // Not a column element, so move it to the last column or delete it if empty
        if (child.innerText.replace(/[\n\s]+/m, "")) {
          // Not empty, so move it to the last column
          if (cols.length > lastMatchedCol) {
            cols[lastMatchedCol].innerNode.appendChild(child);
          } else {
            this.parentGrid.editor.dom.remove(child);
          }
        } else {
          this.parentGrid.editor.dom.remove(child);
        }
      }
    });
    this.stopObserving();
  }

  public copy() {
    const html = this.node.outerHTML;
    copyStore.set({ copied: html });
  }

  public canPaste = derived(
    copyStore,
    ($copyStore) => $copyStore.copied !== null && $copyStore.copied !== ""
  );

  public paste(position: "afterend" | "beforebegin" | "replace" = "afterend") {
    const html = get(copyStore).copied;
    if (html) {
      const tempParent = this.parentGrid.editor.dom.create("div");
      tempParent.innerHTML = html;
      const newNode = tempParent.children[0] as HTMLElement;
      // Run a sanity check on the new node
      if (!newNode || !newNode.dataset.cdbId) {
        console.warn("Invalid node pasted!");
      }
      // Update all IDs to random new ones
      newNode
        .querySelectorAll<HTMLElement>("[data-cdb-id]")
        .forEach((el) => (el.dataset.cdbId = nanoid()));
      if (position === "replace") {
        this.node.insertAdjacentElement("afterend", newNode);
        this.parentGrid.checkChildren();
        this.delete(true);
      } else {
        this.node.insertAdjacentElement(position, newNode);
        this.parentGrid.checkChildren();
      }
      // Trigger new undo level
      this.editor.undoManager.add();
      this.deselectAll();
    }
  }
}
