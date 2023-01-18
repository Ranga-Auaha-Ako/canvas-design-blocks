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
import { SvelteComponent } from "svelte";
import { stateObject } from "src/main";
import ElementManager from "../generic/elementManager";
import MceElement, {
  MceElementStatics,
} from "$lib/elements/generic/mceElement";

export class GridManager extends ElementManager {
  public elementName: string = "Grid";
  public elementClass: ElementManager["elementClass"] = Grid;
  public selector = ".canvas-grid-editor";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor);

    this.importAll();
  }
  public add(grid: Grid | Grid[]) {
    super.add(grid);
    if (Array.isArray(grid)) {
      grid.forEach((g) => g.subscribe(this.cleanGrids));
    } else {
      grid.subscribe(this.cleanGrids);
    }
  }
  public cleanGrids = () => {
    this.update((grids) => {
      return grids.filter((g) => {
        if (get((g as Grid).rows).length === 0) {
          this.editor.dom.remove(g.node, false);
          return false;
        } else return true;
      });
    });
  };
}

export default GridManager;
