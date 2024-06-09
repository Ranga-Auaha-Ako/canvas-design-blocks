import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { ProfileGrid } from "./profileGrid";
import editorStyles from "./element.postcss?inline";
//@ts-ignore

export class ProfilesManager extends ElementManager {
  selector = ".Profiles[data-cdb-version]";
  public elementClass: ElementManager["elementClass"] = ProfileGrid;
  elementName = "Profiles";
  icon = "Canvas.educators";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ProfilesManager;
