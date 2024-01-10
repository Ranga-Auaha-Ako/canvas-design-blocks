import { stateObject } from "src/main";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { ButtonBar } from "./buttonBar";
import "./buttonBar.postcss";
import editorStyles from "./buttonBar.postcss?inline";

export class ButtonBarManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = ButtonBar;
  selector = ".CDB--ButtonBar[data-cdb-version]";
  elementName = "Button Bar";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ButtonBarManager;
