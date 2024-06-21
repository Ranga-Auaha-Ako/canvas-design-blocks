import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { Button } from "./button";
import editorStyles from "./element.postcss?inline";

import buttonVideo from "$assets/block-anims/Button.webm";

export class ButtonManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = Button;
  selector = ".CDB--Button[data-cdb-version]";
  elementName = "Button";
  elementDescription =
    "Buttons are a great way to highlight an important link. Add a colour and icon to help students quickly spot the right link. These are best used sparingly, for when you have a specific action for students to take.";
  elementVideo = buttonVideo;
  icon = "Canvas.link";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ButtonManager;
