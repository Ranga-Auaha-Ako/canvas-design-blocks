import { ElementManager } from "../generic/elementManager";
import type { stateObject } from "src/desktop";
import editorStyles from "./element.postcss?inline";
import { ImageCard } from "./imageCard";

import imageCardAnim from "$assets/block-anims/Image Cards.webm";

export class ImageCardManager extends ElementManager {
  public elementName = "Image Cards";
  public elementClass: ElementManager["elementClass"] = ImageCard;
  elementDescription = `Use image cards to create a grid of visual links. This block is great for lists of high importance links you want students to be able to visually navigate quickly, such as a Modules list.`;
  elementVideo = imageCardAnim;
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
