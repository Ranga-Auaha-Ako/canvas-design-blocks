import { stateObject } from "src/main";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { ProgressNav } from "./progressNav";
import "./button.postcss";
import editorStyles from "./button.postcss?inline";
//@ts-ignore

export class ProgressNavManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = ProgressNav;
  selector = ".CDB--ProgressNav[data-cdb-version]";
  elementName = "ProgressNav";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ProgressNavManager;
