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
import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import editorStyles from "./gridEditor.postcss?inline";

import elementVideo from "$assets/block-anims/Grid.webm";

export class GridManager extends ElementManager {
  public elementName: string = "Grid";
  public elementClass: ElementManager["elementClass"] = Grid;
  elementDescription = `Use a grid to organize content into rows and columns. Grids are a flexible way to create complex layouts, and can contain any combination of elements, including text, images, videos, and more.`;
  elementVideo = elementVideo;
  public selector = ".canvas-grid-editor";
  icon = "Internal.canvas-design-blocks";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

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
