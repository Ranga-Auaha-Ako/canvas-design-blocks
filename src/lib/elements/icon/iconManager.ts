import { stateObject } from "src/main";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { Icon } from "./icon";
import "./icon.postcss";
import editorStyles from "./icon.postcss?inline";
//@ts-ignore

export class IconManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = Icon;
  selector = ".CDB--Icon[data-cdb-version]";
  elementName = "Icon";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default IconManager;
