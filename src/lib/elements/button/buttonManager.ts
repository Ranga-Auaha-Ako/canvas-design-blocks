import { ElementManager } from "../generic/elementManager";
import { Button } from "./button";
import type { stateObject } from "src/main";
import type { MceElementStatics } from "$lib/elements/generic/mceElement";
import type MceElement from "$lib/elements/generic/mceElement";
import editorStyles from "./buttonEditor.postcss?inline";

export class ButtonManager extends ElementManager {
  public elementName = "Button";
  public elementClass: ElementManager["elementClass"] = Button;
  public selector = ".Button[data-cdb-version],.Button[data-cgb-version]";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ButtonManager;
