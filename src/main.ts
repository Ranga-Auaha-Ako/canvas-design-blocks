import { debug } from "svelte/internal";
import { writable } from "svelte/store";
import "./app.postcss";
import tinyMCEStyles from "./lib/tinymce.postcss?inline";
import App from "./App.svelte";
import GridManager, { stateObject } from "./lib/grid/gridManager";
import Grid from "./lib/grid";

const preventBubble = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

const state: stateObject = {
  selectedGrid: writable(null),
  showInterface: writable(false),
};

const loadApp = () => {
  if (!window.tinymce?.activeEditor) {
    // Try again once there is an active editor
    // Could also be init
    window.tinymce.on("activate", loadApp);
  }
  // // Build DIV to contain app
  const svelteHolder = document.createElement("div");
  svelteHolder.style.display = "contents";
  // Annoyingly, we might need to prevent some propogation of events to the rest of the app.
  ["click", "submit", "touchend", "mouseup"].forEach((e) =>
    svelteHolder.addEventListener(e, preventBubble)
  );
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
    // grids.add(Grid.create(grids.state), true);
  });
  ["click", "submit", "touchend", "mouseup"].forEach((e) =>
    openButton.addEventListener(e, preventBubble)
  );
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

window.addEventListener("load", loadApp);
