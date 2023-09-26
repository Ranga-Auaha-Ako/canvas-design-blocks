import { ElementManager } from "../generic/elementManager";
import type { stateObject } from "src/main";
import "./imageCard.postcss";
import editorStyles from "./imageCard.postcss?inline";
import { ImageCard } from "./imageCard";

export class ImageCardManager extends ElementManager {
  public elementName = "Image Cards";
  public elementClass: ElementManager["elementClass"] = ImageCard;
  public selector = ".ImageCards[data-cdb-version]";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ImageCardManager;
