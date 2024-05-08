import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { __Name } from "./__name";
import "./element.postcss";
import editorStyles from "./element.postcss?inline";
//@ts-ignore

export class __NameManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = __Name;
  selector = ".CDB--__Name[data-cdb-version]";
  elementName = "__Name";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default __NameManager;
