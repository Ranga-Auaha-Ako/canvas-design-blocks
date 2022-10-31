import { debug } from "svelte/internal";
import { writable } from "svelte/store";
import "./app.postcss";
import tinyMCEStyles from "./lib/tinymce.postcss?inline";
import App from "./App.svelte";
import GridManager, { stateObject } from "./lib/grid/gridManager";
import Grid from "./lib/grid";
import type { Editor } from "tinymce";

const preventBubble = (elem: Element) => {
  ["click", "submit", "touchend", "mouseup"].forEach((evt) =>
    elem.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    })
  );
};

const state: stateObject = {
  showInterface: writable(false),
};

export const loadApp = () => {
  console.log("Loading Canvas Grid Editor");
  if (!window.tinymce?.activeEditor) {
    // Try again once there is an active editor
    window.tinymce.on("AddEditor", ({ editor }: { editor: Editor }) => {
      editor.on("init", () => {
        loadApp();
      });
    });
    console.log("No active editor, waiting for one");
    return;
  } else {
    console.log("Active editor found");
  }
  // // Build DIV to contain app
  const svelteHolder = document.createElement("div");
  svelteHolder.style.display = "contents";
  // Annoyingly, we might need to prevent some propogation of events to the rest of the app.
  preventBubble(svelteHolder);
  svelteHolder.id = "canvas-grid-container";
  // Append app after body
  document.body.insertAdjacentElement("beforeend", svelteHolder);
  // Create Grid Manager
  const grids = new GridManager(state);
  // Create app
  const app = new App({
    target: svelteHolder,
    props: { state, grids },
  });
  // Add button to open grid editor
  const openButton = document.createElement("button");
  openButton.classList.add("btn", "btn-primary", "pull-right");
  openButton.style.marginLeft = "0.2rem";
  openButton.innerText = "Open Grid Editor";
  openButton.addEventListener("click", (e) => {
    state.showInterface.set(true);
  });
  preventBubble(openButton);
  document
    .querySelector(".edit-header")
    ?.insertAdjacentElement("beforeend", openButton);
  // Inject our styles into the TinyMCE editor
  const editorStyles = document.createElement("style");
  editorStyles.innerHTML = tinyMCEStyles;
  window.tinymce.activeEditor
    .getBody()
    .insertAdjacentElement("beforebegin", editorStyles);
};

// Load the app only on certain pages
const loc = window.location.pathname;
console.log(loc);
if (/pages\/?$|pages\/.+\/edit$/.test(loc)) {
  window.addEventListener("load", loadApp);
}
