import { debug } from "svelte/internal";
import { writable } from "svelte/store";
import type { Editor } from "tinymce";
import GridManager, { stateObject } from "$lib/grid/gridManager";
import preventBubble from "$lib/util/preventBubble";
import "./app.postcss";
import tinyMCEStyles from "$lib/tinymce/styles.postcss?inline";
import Toolbar from "./entrypoints/Toolbar.svelte";
import Sidebar from "./entrypoints/Sidebar.svelte";
import EditorApp from "./entrypoints/Editor.svelte";

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

const loadSidebar = (props: Sidebar["$$prop_def"]) => {
  // Build DIV to contain app
  const div = document.createElement("div");
  div.style.display = "contents";
  div.dataset.mceBogus = "1";
  // div.dataset.mceType = "Canvas-Grid-Builder";
  div.id = "canvas-grid-container";
  document.body.insertAdjacentElement("beforeend", div);
  preventBubble(div, true);
  // Create app
  return new Sidebar({
    target: div,
    props,
  });
};

const loadToolbar = (props?: Toolbar["$$prop_def"]) => {
  const target = document.body;
  if (!target) return;
  return new Toolbar({
    target,
    props,
  });
};

const loadEditor = (editor: Editor, props?: EditorApp["$$prop_def"]) => {
  const target = editor.getBody();
  if (!target) return;
  return new EditorApp({
    target,
    props,
  });
};

export const loadApp = async () => {
  // Get TinyMCE Editor
  const editor = await getEditor();

  // Create Grid Manager
  const grids = new GridManager(state, editor);

  // Load sidebar
  loadSidebar({ state, grids });

  // Add button to open grid editor
  loadToolbar({ state });

  // Load editor (inject live interface into TinyMCE iframe)
  loadEditor(editor, { state, grids });

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
