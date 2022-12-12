import { writable } from "svelte/store";
import type { Editor } from "tinymce";
import GridManager, { stateObject } from "$lib/grid/gridManager";
import "./app.postcss";
import tinyMCEStyles from "$lib/tinymce/styles.postcss?inline";
import Toolbar from "./entrypoints/Toolbar.svelte";
import Sidebar from "./entrypoints/Sidebar.svelte";

const state: stateObject = {
  showInterface: writable(false),
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

  // Create Grid Manager
  const grids = new GridManager(state, editor);

  // Add button to open grid editor
  loadToolbar({ state, grids });

  // Inject our styles into the TinyMCE editor
  const editorStyles = document.createElement("style");
  editorStyles.innerHTML = tinyMCEStyles;
  editor.getBody().insertAdjacentElement("beforebegin", editorStyles);
};

// Load the app only on certain pages
const loc = window.location.pathname;
if (/pages\/?$|pages\/.+\/edit$/.test(loc)) {
  window.addEventListener("load", loadApp);
}
