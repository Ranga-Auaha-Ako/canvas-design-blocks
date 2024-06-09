import { ElementManager } from "../generic/elementManager";
import type { stateObject } from "src/desktop";
import editorStyles from "./element.postcss?inline";
import { ImageCard } from "./imageCard";

export class ImageCardManager extends ElementManager {
  public elementName = "Image Cards";
  public elementClass: ElementManager["elementClass"] = ImageCard;
  public selector = ".ImageCards[data-cdb-version]";
  public icon = "Canvas.image";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ImageCardManager;
