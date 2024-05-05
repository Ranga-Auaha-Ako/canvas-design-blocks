import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { Button } from "./button";
import "./button.postcss";
import editorStyles from "./button.postcss?inline";
//@ts-ignore

export class ButtonManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = Button;
  selector = ".CDB--Button[data-cdb-version]";
  elementName = "Button";
  icon = "Canvas.link";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ButtonManager;
