import { writable } from "svelte/store";
import type { Editor } from "tinymce";
import GridManager from "$lib/elements/grid/gridManager";
import "./app.postcss";
import "$lib/util/tailwind.postcss";
import tailwindStyles from "$lib/util/tailwind.base.postcss?inline";
import Toolbar from "./entrypoints/Toolbar.svelte";
import type { Writable } from "svelte/store";
import { SvelteComponent } from "svelte";
import { ButtonManager } from "$lib/elements/svelteButton/buttonManager";
import ImageCardManager from "$lib/elements/imageCard/imageCardManager";
import { ProfilesManager } from "$lib/elements/profiles/profilesManager";
import { CourseHeaderManager } from "$lib/elements/courseHeader/courseHeaderManager";

if (import.meta.env.DEV && document.location.hostname === "localhost") {
  await import("virtual:inst-env");
}

export interface stateObject {
  showInterface: Writable<boolean>;
  configComponent: Writable<{
    component: typeof SvelteComponent<any>;
    props: Record<string, any>;
  } | null>;
}

const state: stateObject = {
  showInterface: writable(false),
  configComponent: writable(null),
};

if (import.meta.env.DEV) {
  console.log("Dev mode enabled");
  window.onbeforeunload = function () {};
  state.showInterface.set(true);
}

let attempts = 0;
let hasLoaded = false;
const getEditor = () =>
  new Promise<Editor>((resolve, reject) => {
    if (!window.tinymce || window.tinymce?.activeEditor.getBody() === null) {
      setTimeout(() => {
        // Try again after five seconds, waiting up to 30 seconds.
        attempts++;
        if (attempts < 10) resolve(getEditor());
        else reject("Could not find TinyMCE editor");
      }, 50 * Math.pow(1.8, attempts - 1));
    } else if (!window.tinymce?.activeEditor) {
      // Try again once there is an active editor
      window.tinymce.on("AddEditor", ({ editor }: { editor: Editor }) => {
        editor.on("init", () => {
          hasLoaded = true;
          resolve(editor);
        });
      });
    } else {
      hasLoaded = true;
      resolve(window.tinymce.activeEditor);
    }
  });

const loadToolbar = (props?: Toolbar["$$prop_def"]) => {
  const target = document.querySelector("#left-side #section-tabs");
  if (!target) return;
  // Create list item at start of target
  const li = document.createElement("li");
  li.classList.add("section");
  target.insertAdjacentElement("afterbegin", li);

  return new Toolbar({
    target: li,
    props,
  });
};

export const loadApp = async () => {
  // If tool is already loaded, exit
  // Get TinyMCE Editor
  const editor = await getEditor().catch((e) => {
    console.error(e);
    return null;
  });
  if (!editor) return;
  console.log("Editor loaded", editor);

  // Create Element Managers
  const grids = new GridManager(state, editor);
  const buttons = new ButtonManager(state, editor);
  const imagecards = new ImageCardManager(state, editor);
  const profiles = new ProfilesManager(state, editor);
  const courseHeader = new CourseHeaderManager(state, editor);

  // Add button to open grid editor
  const toolbar = loadToolbar({
    state,
    managers: [grids, buttons, imagecards, profiles, courseHeader],
  });

  // Inject tailwind base styles into editor
  const pageStylesEl = editor.getDoc().createElement("style");
  pageStylesEl.innerHTML = tailwindStyles;
  editor.getBody().insertAdjacentElement("beforebegin", pageStylesEl);

  // Add class to page body when toolbar is open
  state.showInterface.subscribe((show) => {
    if (show) {
      document.body.classList.add("cdb-toolbar-open");
    } else {
      document.body.classList.remove("cdb-toolbar-open");
    }
  });
  // Hide app when TinyMCE editor is removed
  editor.on("detach", () => {
    console.log("Editor removed");
    toolbar?.$destroy();
    // Load the app again when the editor is reloaded
    setTimeout(() => {
      loadApp();
    }, 100);
  });
};

if (!window._LOADED_DESIGNBLOCKS) {
  window._LOADED_DESIGNBLOCKS = true;

  console.log("Loading app");

  switch (document.readyState) {
    case "loading":
      console.log("Page loading, waiting for load");
      window.addEventListener("DOMContentLoaded", loadApp);
      break;
    case "interactive":
    case "complete":
      console.log("Page already loaded, loading app");
      loadApp();
      break;
  }

  // Load the app only on certain pages
  // const loc = window.location.pathname;
  // if (/pages\/?$|pages\/.+\/edit$/.test(loc)) {
  // }
}
