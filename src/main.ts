import { writable } from "svelte/store";
import type { Editor } from "tinymce";
import GridManager from "$lib/elements/grid/gridManager";
import pageStyles from "./app.postcss?inline";
import tinyMCEStyles from "$lib/tinymce/styles.postcss?inline";
import Toolbar from "./entrypoints/Toolbar.svelte";
import type { Writable } from "svelte/store";
import { SvelteComponent } from "svelte";
import ButtonManager from "$lib/elements/button/buttonManager";

export interface stateObject {
  showInterface: Writable<boolean>;
  configComponent: Writable<{
    component: typeof SvelteComponent;
    props: Record<string, any>;
  } | null>;
}

const state: stateObject = {
  showInterface: writable(false),
  configComponent: writable(null),
};

let attempts = 0;
const getEditor = () =>
  new Promise<Editor>((resolve, reject) => {
    if(!window.tinymce) {
      setTimeout(() => {
        // Try again after five seconds, waiting up to 30 seconds.
        attempts++;
        if (attempts < 6) resolve(getEditor());
        else reject("Could not find TinyMCE editor");
      }, 5000);
    }
    if (!window.tinymce?.activeEditor) {
      // Try again once there is an active editor
      window.tinymce.on("AddEditor", ({ editor }: { editor: Editor }) => {
        editor.on("init", () => {
          resolve(editor);
        });
      });
      console.log("No active editor, waiting for one");
    } else {
      console.log("Active editor found");
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

  // Add button to open grid editor
  const toolbar = loadToolbar({ state, managers: [grids, buttons] });

  // Inject our styles into the TinyMCE editor
  const editorStyles = document.createElement("style");
  editorStyles.innerHTML = tinyMCEStyles;
  editor.getBody().insertAdjacentElement("beforebegin", editorStyles);

  // Inject our styles into the page
  const pageStylesEl = document.createElement("style");
  pageStylesEl.innerHTML = pageStyles;
  document.head.insertAdjacentElement("beforeend", pageStylesEl);

  // Add class to page body when toolbar is open
  state.showInterface.subscribe((show) => {
    if (show) {
      document.body.classList.add("cgb-toolbar-open");
    } else {
      document.body.classList.remove("cgb-toolbar-open");
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

console.log("Loading app");
window.addEventListener("load", loadApp);
// Load the app only on certain pages
// const loc = window.location.pathname;
// if (/pages\/?$|pages\/.+\/edit$/.test(loc)) {
// }
