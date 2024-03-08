import buttonBar from "./buttonBar/buttonBarManager";
import svelteButton from "./svelteButton/buttonManager";
import grid from "./grid/gridManager";
import courseHeader from "./courseHeader/courseHeaderManager";
import icon from "./icon/iconManager";
import imageCard from "./imageCard/imageCardManager";
import profiles from "./profiles/profilesManager";
import type ElementManager from "./generic/elementManager";
import ImageCardLegacy from "./imageCard/imageCardLegacy";

export type implementedClass<T extends abstract new (...args: any) => any> =
  (new (...args: ConstructorParameters<T>) => InstanceType<T>) & T;

export const editorManagers = [
  buttonBar,
  svelteButton,
  grid,
  courseHeader,
  icon,
  imageCard,
  profiles,
] as implementedClass<typeof ElementManager>[];

// Legacy managers are not included in the editor interface, but are used to
// import legacy content.
export const legacyManagers = {
  ImageCardLegacy,
};
