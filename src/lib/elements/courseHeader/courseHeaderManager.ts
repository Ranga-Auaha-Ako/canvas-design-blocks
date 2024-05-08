import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import { CourseHeader } from "./courseHeader";
import editorStyles from "./element.postcss?inline";

export class CourseHeaderManager extends ElementManager {
  selector = ".CourseHeader[data-cdb-version]";
  public elementClass: ElementManager["elementClass"] = CourseHeader;
  elementName = "Header";
  icon = "Canvas.header";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default CourseHeaderManager;
