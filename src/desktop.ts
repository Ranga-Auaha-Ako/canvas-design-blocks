import type ToolbarType from "./entrypoints/Toolbar.svelte";
import type ElementManager from "$lib/elements/generic/elementManager";
import type { SvelteComponent } from "svelte";
import type { Editor } from "tinymce";
import type * as editorLoaderType from "$lib/util/loaders/editorLoader";
import { compareVersions } from "compare-versions/lib/esm/compareVersions";
import { version } from "$lib/util/constants";
import { get, writable, type Writable } from "svelte/store";
import { clientManagers } from "./shared";

// These are required for client-side elements to load
import blockStyles from "virtual:blocks-icons-editor-styles";
import gtag from "$lib/util/gtag";
// Base styles
import "$lib/util/tailwind.postcss";
import "virtual:blocks-icons.css";
import "./app.postcss";
import tailwindStyles from "$lib/util/tailwind.base.postcss?inline";
import { courseEnv } from "$lib/util/courseEnv";
import glossaryClientManager from "$lib/elements/glossary/glossaryClientManager";

// Sandpit mode
if (import.meta.env.MODE === "sandpit") {
  console.log("Sandpit mode enabled");
  import("./sandpit/sandpit");
}

export interface stateObject {
  showInterface: Writable<boolean>;
  configComponent: Writable<{
    component: typeof SvelteComponent<any>;
    props: Record<string, any>;
  } | null>;
  loadedBlocks: Writable<ElementManager[]>;
}

// Variables to track the state of the app
const state: stateObject = {
  showInterface: writable(false),
  configComponent: writable(null),
  loadedBlocks: writable([]),
};

// Start by setting up the loader
async function beginLaunch() {
  // Immediately load the editor loader if it needs to be loaded
  let editorLoader;
  if ("RICH_CONTENT_APP_HOST" in courseEnv) {
    editorLoader = import("$lib/util/loaders/editorLoader");
  }
  // Check if the design blocks have already been loaded
  // Handle version comparisions
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
    // Load the app
    switch (document.readyState) {
      case "loading":
        window.addEventListener("DOMContentLoaded", () => loadApp());
        break;
      case "interactive":
      case "complete":
        loadApp(editorLoader);
        break;
    }
  } else {
    console.log("App already loaded");
  }
}

// This function handles the initial launch of the tool, and conditionally loads modules
export async function loadApp(
  editorLoader: Promise<typeof editorLoaderType> | undefined = undefined
) {
  // Track users who view content made with DesignBlocks
  if (document.querySelector("div[data-cdb-version]")) {
    gtag("event", "design_blocks_viewer", {
      event_category: "Design Blocks",
      cdb_version: version,
    });
  }
  // Load any client-side elements
  [
    ...(await clientManagers),
    // Load desktop-only managers
    glossaryClientManager,
  ].forEach((manager) => {
    manager.renderClientComponent();
  });
  // Get TinyMCE Editor
  const editor = await getEditor().catch((e) => {
    // No editor, so don't load the app
    return null;
  });

  // Register unload function
  window._UNLOAD_DESIGNBLOCKS = () => {
    if (hasLoaded) {
      console.log(`Unloading app: ${__APP_VERSION__}`);
      toolbar?.$destroy();
      get(state.loadedBlocks).forEach((block) => block.detatch());
      hasLoaded = false;
      return true;
    }
    return false;
  };

  // ----
  // ---- EVERYTHING BELOW THIS LINE ONLY RUNS IN EDIT MODE ----
  if (!editor) return;
  // ----
  // ----

  // Editor managers are loaded async to reduce initial bundle size
  const { editorManagers, toolbarPanels, Toolbar } =
    (await editorLoader) || (await import("$lib/util/loaders/editorLoader"));
  state.loadedBlocks.set(editorManagers.map((m) => new m(state, editor)));
  // Add toolbar
  const toolbar = await loadToolbar(Toolbar, {
    state,
    managers: state.loadedBlocks,
    additionalItems: toolbarPanels,
  });
  // Inject tailwind base styles into editor
  const pageStylesEl = editor.getDoc().createElement("style");
  pageStylesEl.innerHTML = tailwindStyles + blockStyles;
  editor.getBody().insertAdjacentElement("beforebegin", pageStylesEl);

  // Hide app when TinyMCE editor is removed
  editor.on("detach", () => {
    console.log("Editor removed");
    toolbar?.$destroy();
    // Load the app again when the editor is reloaded
    setTimeout(() => {
      loadApp(editorLoader);
    }, 100);
  });
}

// Loads the toolbar
async function loadToolbar(
  Toolbar: typeof ToolbarType,
  props?: ToolbarType["$$prop_def"]
) {
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
}

if (import.meta.env.DEV) {
  console.log("Dev mode enabled");
  window.onbeforeunload = function () {};
  state.showInterface.set(true);
}

// Manages getting the TinyMCE editor
let attempts = 0;
let hasLoaded = false;
export const getEditor = () =>
  new Promise<Editor>((resolve, reject) => {
    // First check to see if we are on a page which can have an editor
    const url = window.location.pathname;
    const valid_locations = [
      /^\/courses\/\d+\/pages\/.+\/edit$/,
      /^\/courses\/\d+\/pages\/?$/,
      /^\/courses\/\d+\/discussion_topics\/new$/,
      /^\/courses\/\d+\/discussion_topics\/.+\/edit$/,
      /^\/courses\/\d+\/assignments\/new/,
      /^\/courses\/\d+\/assignments\/\d+\/edit$/,
      /^\/courses\/\d+\/assignments\/syllabus$/,
      /^\/courses\/\d+\/quizzes\/\d+\/edit\/?$/,
    ];
    if (
      !(
        window.location.hostname === "localhost" ||
        import.meta.env.MODE === "sandpit" ||
        valid_locations.some((loc) => loc.test(url))
      )
    ) {
      reject("Not a valid location for editor");
    }
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

// We're done! Begin the launch
beginLaunch();
