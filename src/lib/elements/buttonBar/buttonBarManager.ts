import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { ButtonBar } from "./buttonBar";
import editorStyles from "./element.postcss?inline";

export class ButtonBarManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = ButtonBar;
  selector = ".CDB--ButtonBar[data-cdb-version]";
  elementName = "Button Bar";
  icon = "Internal.steps";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ButtonBarManager;
