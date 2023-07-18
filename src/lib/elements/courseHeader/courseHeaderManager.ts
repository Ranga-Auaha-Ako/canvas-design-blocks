import { stateObject } from "src/main";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { CourseHeader } from "./courseHeader";
import "./courseHeader.postcss";
import editorStyles from "./courseHeader.postcss?inline";
//@ts-ignore

export class CourseHeaderManager extends ElementManager {
  selector = ".CourseHeader[data-cdb-version]";
  public elementClass: ElementManager["elementClass"] = CourseHeader;
  elementName = "Header";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}
