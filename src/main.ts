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
import { version } from "$lib/util/constants";
import { compareVersions } from "compare-versions";
import type ElementManager from "$lib/elements/generic/elementManager";

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
    if (!window.tinymce || window.tinymce?.activeEditor?.getBody() === null) {
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

let loaded_blocks: ElementManager[] = [];

export const loadApp = async () => {
  // If tool is already loaded, exit
  // Get TinyMCE Editor
  const editor = await getEditor().catch((e) => {
    console.error(e);
    return null;
  });
  if (!editor) return;

  // Create Element Managers
  loaded_blocks = [
    new GridManager(state, editor),
    new ButtonManager(state, editor),
    new ImageCardManager(state, editor),
    new ProfilesManager(state, editor),
    new CourseHeaderManager(state, editor),
  ];

  // Add button to open grid editor
  const toolbar = loadToolbar({
    state,
    managers: loaded_blocks,
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
  // Register unload function
  window._UNLOAD_DESIGNBLOCKS = () => {
    if (hasLoaded) {
      console.log("Unloading app");
      toolbar?.$destroy();
      loaded_blocks.forEach((block) => block.detatch());
      hasLoaded = false;
      return true;
    }
    return false;
  };
};

const beginLaunch = () => {
  if (
    !window._LOADED_DESIGNBLOCKS ||
    (compareVersions(window._LOADED_DESIGNBLOCKS, version) < 0 &&
      window._UNLOAD_DESIGNBLOCKS !== undefined)
  ) {
    if (window._LOADED_DESIGNBLOCKS && window._UNLOAD_DESIGNBLOCKS) {
      const has_unloaded = window._UNLOAD_DESIGNBLOCKS();
      if (!has_unloaded) {
        console.log("DesignBlocks failed to unload");
        return;
      }
    }
    window._LOADED_DESIGNBLOCKS = version;

    console.log("Loading app");

    switch (document.readyState) {
      case "loading":
        window.addEventListener("DOMContentLoaded", loadApp);
        break;
      case "interactive":
      case "complete":
        loadApp();
        break;
    }

    // Load the app only on certain pages
    // const loc = window.location.pathname;
    // if (/pages\/?$|pages\/.+\/edit$/.test(loc)) {
    // }
  }
};

beginLaunch();
