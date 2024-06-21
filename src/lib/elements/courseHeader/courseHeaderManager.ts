import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import { CourseHeader } from "./courseHeader";
import editorStyles from "./element.postcss?inline";
import elementVideo from "$assets/block-anims/Header.webm";
export class CourseHeaderManager extends ElementManager {
  selector = ".CourseHeader[data-cdb-version]";
  public elementClass: ElementManager["elementClass"] = CourseHeader;
  elementName = "Header";
  elementDescription = `Use a header on your home page, at the start of a module, or anywhere you'd like to introduce a new section. Headers are a great way to provide context and set the tone for the content that follows, and can contain text, an image or icon, and links.`;
  elementVideo = elementVideo;
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
