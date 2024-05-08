import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { Icon } from "./icon";
import editorStyles from "./element.postcss?inline";
//@ts-ignore

export class IconManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = Icon;
  selector = ".CDB--Icon[data-cdb-version]";
  elementName = "Icon";
  icon = "Canvas.button-and-icon-maker";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default IconManager;
