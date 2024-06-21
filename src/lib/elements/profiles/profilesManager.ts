import { stateObject } from "src/desktop";
import ElementManager from "../generic/elementManager";
import MceElement, { MceElementStatics } from "../generic/mceElement";
import { ProfileGrid } from "./profileGrid";
import editorStyles from "./element.postcss?inline";
import profileVideo from "$assets/block-anims/Profile.webm";

export class ProfilesManager extends ElementManager {
  selector = ".Profiles[data-cdb-version]";
  public elementClass: ElementManager["elementClass"] = ProfileGrid;
  elementName = "Profiles";
  elementDescription =
    "Quickly introduce yourself, a member of the teaching staff, or a class representative. Add an image, contact details, and a bio to your Canvas profile and this block will automatically use those details on all new pages.";
  elementVideo = profileVideo;
  icon = "Canvas.educators";

  constructor(
    public readonly state: stateObject,
    public readonly editor = window.tinymce.activeEditor
  ) {
    super(state, editor, editorStyles);

    this.importAll();
  }
}

export default ProfilesManager;
