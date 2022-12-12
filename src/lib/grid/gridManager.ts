import {
  derived,
  get,
  readable,
  Subscriber,
  Unsubscriber,
  writable,
} from "svelte/store";
import type { Writable, Readable } from "svelte/store";
import Row from "./row";
import Grid from "./grid";
import type { Editor } from "tinymce";

export interface stateObject {
  showInterface: Writable<boolean>;
}

export class GridManager implements Writable<Grid[]> {
  private _grids: Writable<Grid[]> = writable([]);
  // public readonly selectedGrid;

  public set = this._grids.set;
  public update = this._grids.update;
  public subscribe = this._grids.subscribe;
  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    this.importAll();

    this.watchEditor();

    this._grids.subscribe((grids) => {
      console.log("Grids updated", grids);
    });
  }
  public add(grid: Grid | Grid[]) {
    if (Array.isArray(grid)) {
      this.update((grids) => {
        return [...grids, ...grid];
      });
      grid.forEach((g) => {
        g.subscribe(this.cleanGrids);
      });
    } else {
      this.update((grids) => [...grids, grid]);
      grid.subscribe(this.cleanGrids);
    }
  }
  public cleanGrids = () => {
    this._grids.update((grids) => {
      return grids.filter((g) => {
        if (get(g.rows).length === 0) {
          this.editor.dom.remove(g.node, false);
          return false;
        } else return true;
      });
    });
  };
  public remove(grid: Grid | string) {
    let foundGrid: Grid | undefined;
    if (typeof grid === "string") foundGrid = this.get(grid);
    else foundGrid = grid;
    if (!foundGrid) return;
    this.update((grids) => {
      return grids.filter((g) => g !== grid);
    });
  }
  public get(id: string) {
    return get(this._grids).find((g) => g.id === id);
  }

  public findGrids(returnAll = false) {
    const root = this.editor.dom.getRoot();
    // Filter to only elements we haven't already discovered
    const existingIDs = get(this._grids).map((g) => g.id);
    return Array.from(root.querySelectorAll(".canvas-grid-editor")).filter(
      (e) => {
        // Discard TinyMCE Fake Elements
        if (e.closest("[data-mce-bogus]")) return false;
        if (returnAll) return true;
        // Get ID
        const id = (e as HTMLElement)?.dataset.cgeId;
        // No ID Means the grid is untracked - we need to track it
        if (!id) return true;
        // If we have an ID, check if we are already tracking it
        const foundIndex = existingIDs.indexOf(id);
        if (foundIndex === -1) return true;
        // We are already tracking it. Any more grids with this ID are duplicates and should be imported with a new ID;
        existingIDs.splice(foundIndex, 1);
        return false;
      }
    ) as HTMLElement[];
  }

  public importAll() {
    const newGrids = this.findGrids().map((grid) =>
      Grid.import(this.state, grid, this, this.editor)
    );
    if (newGrids.length) this.add(newGrids);
  }

  public checkGrids() {
    // Check to see if our internal representation of grids matches the DOM
    // If not, update our internal representation
    // console.log("Checking grids");

    // Disconnect any deleted grids
    const gridIds = this.findGrids(true).map((g) => g.dataset.cgeId);
    const internalGridIds = get(this._grids).map((g) => g.id);
    const deletedGridIds = internalGridIds.filter(
      (id) => !gridIds.includes(id)
    );
    deletedGridIds.forEach((id) => {
      console.log("Removing grid", id);
      const grid = this.get(id);
      if (grid) grid.delete();
    });

    // Check existing grids for changes
    const nodeUpdated = get(this._grids).filter((g) => {
      if (!g.editor.getDoc().contains(g.node)) {
        console.log("Grid no longer in DOM, removing", g.id);
        g.delete();
        return true;
      }
      return false;
    });
    if (nodeUpdated.length)
      this._grids.update((grids) =>
        grids.filter((g) => !nodeUpdated.includes(g))
      );

    // Import any new grids
    this.importAll();

    // Fire off checks in each grid
    get(this._grids).forEach((g) => g.checkChildren());
  }

  public watchEditor() {
    console.log("Watching editor", this.editor.getBody());
    // Keep an eye on TinyMCE in case operations within the tool cause the "real" grids to be removed, added, moved, or otherwise modified.

    // Events where we know to check for changes
    const potentialChangeEvents = ["Undo", "Redo", "BeforeAddUndo"];
    potentialChangeEvents.forEach((evtName) => {
      this.editor.on(evtName, (e) => {
        this.checkGrids();
      });
    });

    // Events where we need to hide the interface
    const hideInterfaceEvents = ["dragstart"];
    hideInterfaceEvents.forEach((evtName) => {
      this.editor.on(evtName, (e) => {
        this.state.showInterface.set(false);
        get(this._grids).forEach((g) => g.selected.set(false));
      });
    });
  }
}

export default GridManager;
