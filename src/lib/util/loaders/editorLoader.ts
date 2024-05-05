// Elements
import buttonBar from "$lib/elements/buttonBar/buttonBarManager";
import svelteButton from "$lib/elements/svelteButton/buttonManager";
import grid from "$lib/elements/grid/gridManager";
import courseHeader from "$lib/elements/courseHeader/courseHeaderManager";
import icon from "$lib/elements/icon/iconManager";
import imageCard from "$lib/elements/imageCard/imageCardManager";
import profiles from "$lib/elements/profiles/profilesManager";
// Client-side Elements
// import GlossaryToolbarPanel from "$lib/elements/glossary/glossaryToolbarPanel.svelte";
export { default as Toolbar } from "$lib/../entrypoints/Toolbar.svelte";
// Utils
import type ElementManager from "$lib/elements/generic/elementManager";
import type { SvelteComponent } from "svelte";

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
  // ImageCardLegacy,
};

export const toolbarPanels = [
  // GlossaryToolbarPanel,
] as (typeof SvelteComponent)[];
