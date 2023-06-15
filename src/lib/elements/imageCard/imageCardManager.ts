import { ElementManager } from "../generic/elementManager";
import { ImageCard } from "./imageCard";
import type { stateObject } from "src/main";
import type { MceElementStatics } from "$lib/elements/generic/mceElement";
import type MceElement from "$lib/elements/generic/mceElement";
import { ImageCardRow } from "./imageCardRow";

export class ImageCardManager extends ElementManager {
  public elementName = "Image Card";
  public elementClass: ElementManager["elementClass"] = ImageCardRow;
  public selector = ".ImageCardRow[data-cdb-version]";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor);

    this.importAll();
  }
}

export default ImageCardManager;
