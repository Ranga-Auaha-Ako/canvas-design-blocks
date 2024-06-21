import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { Icon } from "./icon";
import editorStyles from "./element.postcss?inline";

import iconAnim from "$assets/block-anims/Icon Block.webm";

export class IconManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = Icon;
  selector = ".CDB--Icon[data-cdb-version]";
  elementName = "Icon";
  elementDescription = `Icons are a great way to add visual interest to your content, and can be used to represent concepts, actions, or objects. Icons can be used on their own, or in combination with text, images, and other elements.`;
  elementVideo = iconAnim;
  icon = "Canvas.button-and-icon-maker";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default IconManager;
