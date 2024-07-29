import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { ButtonBar } from "./buttonBar";
import editorStyles from "./element.postcss?inline";
import ButtonBarTooltip from "./buttonBarTooltip.svelte";
import buttonAnim from "$assets/block-anims/Button Bar.webm";

export class ButtonBarManager extends ElementManager {
  public elementClass: ElementManager["elementClass"] = ButtonBar;
  selector = ".CDB--ButtonBar[data-cdb-version]";
  elementName = "Button Bar";
  elementDescription = `Connect a series or group of important links together to form a "button bar". Useful for showing progress through a a series of modules, or for providing quick access to important links in a section.`;
  elementVideo = buttonAnim;
  icon = "Internal.steps";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ButtonBarManager;
