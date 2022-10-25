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

export default class implements Writable<Grid[]> {
  private _grids: Writable<Grid[]> = writable([]);
  // public readonly selectedGrid;

  public set = this._grids.set;
  public update = this._grids.update;
  public subscribe = this._grids.subscribe;
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

  public findGrids() {
    const root = this.editor.dom.getRoot();
    // Filter to only elements we haven't already discovered
    return Array.from(root.querySelectorAll(".canvas-grid-editor")).filter(
      (e) => {
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
}
