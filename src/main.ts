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

const getEditor = () =>
  new Promise<Editor>((resolve) => {
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
  const editor = await getEditor();

  // Create Element Managers
  const grids = new GridManager(state, editor);
  const buttons = new ButtonManager(state, editor);

  // Add button to open grid editor
  loadToolbar({ state, managers: [buttons] });

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
};

// Load the app only on certain pages
const loc = window.location.pathname;
if (/pages\/?$|pages\/.+\/edit$/.test(loc)) {
  window.addEventListener("load", loadApp);
}
