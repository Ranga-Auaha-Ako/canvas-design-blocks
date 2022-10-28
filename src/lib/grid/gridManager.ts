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
import Grid from "./index";
import type { Editor } from "tinymce";

export interface stateObject {
  showInterface: Writable<boolean>;
}

export default class GridManager implements Writable<Grid[]> {
  private _grids: Writable<Grid[]> = writable([]);
  // public readonly selectedGrid;

  public set = this._grids.set;
  public update = this._grids.update;
  public subscribe = this._grids.subscribe;
  public startedWatching = false; // Only start watching for grid changes once we have a grid
  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    // this.selectedGrid = derived(
    //   [this._grids, this.state.selectedGrid],
    //   ([$grids, $selectedGrid]) => {
    //     return $grids.find((g) => g.id === $selectedGrid);
    //   }
    // );
    this.importAll();
    this._grids.subscribe((grids) => {
      if (!this.startedWatching && grids.length) {
        this.startedWatching = true;
        this.watchEditor();
      }
    });
  }
  public add(grid: Grid | Grid[], select = false) {
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
      // if (select) this.state.selectedGrid.set(grid.id);
      this.state.showInterface.set(true);
    }
  }
  public cleanGrids = () => {
    this._grids.update((grids) => {
      return grids.filter((g) => {
        if (get(g.rows).length === 0) {
          this.editor.dom.remove(g.gridRoot, false);
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
    return Array.from(root.querySelectorAll(".canvas-grid-editor")).filter(
      (e) => {
        // Discard TinyMCE Fake Elements
        if (e.closest("[data-mce-bogus]")) return false;
        if (returnAll) return true;
        const id = (e as HTMLElement)?.dataset.cgeId;
        if (!id) return true;
        return !this.get(id);
      }
    ) as HTMLElement[];
  }

  public importAll() {
    const newGrids = this.findGrids().map((grid) =>
      Grid.import(this.state, this.editor, grid)
    );
    this.add(newGrids);
  }

  public checkGrids() {
    // Check to see if our internal representation of grids matches the DOM
    // If not, update our internal representation
    console.log("Checking grids");

    // Disconnect any deleted grids
    const gridIds = this.findGrids(true).map((g) => g.dataset.cgeId);
    const internalGridIds = get(this._grids).map((g) => g.id);
    const deletedGridIds = internalGridIds.filter(
      (id) => !gridIds.includes(id)
    );
    deletedGridIds.forEach((id) => {
      const grid = this.get(id);
      if (grid) grid.destroy();
    });

    // Import any new grids
    this.importAll();
  }

  public watchEditor() {
    // Keep an eye on TinyMCE in case operations within the tool cause the "real" grids to be removed, added, moved, or otherwise modified.

    // Events where we know to check for changes
    const potentialChangeEvents = ["Undo", "Redo"];
    potentialChangeEvents.forEach((evtName) => {
      this.editor.on(evtName, (e) => {
        this.checkGrids();
      });
    });
    // Watch DOM state for changes
    // Mutation observer to delete other times a grid is being removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.removedNodes.length) {
          // Check to see if any of the removed nodes are grids
          this.checkGrids();
        }
      });
    });

    observer.observe(this.editor.getBody(), { childList: true });
  }
}
