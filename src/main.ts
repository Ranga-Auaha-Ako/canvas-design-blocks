import { debug } from "svelte/internal";
import { writable } from "svelte/store";
import "./app.postcss";
import tinyMCEStyles from "./lib/tinymce.postcss?inline";
import App from "./App.svelte";

const preventBubble = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

let showSidebar = writable(false);

const loadApp = () => {
  if (!window.tinymce?.activeEditor) {
    // Try again once there is an active editor
    // Could also be init
    window.tinymce.on("activate", loadApp);
  }
  // // Build DIV to contain app
  const svelteHolder = document.createElement("div");
  svelteHolder.style.display = "contents";
  // Annoyingly, we need to prevent some propogation of events to the rest of the app.
  ["click", "submit", "touchend", "mouseup"].forEach((e) =>
    svelteHolder.addEventListener(e, preventBubble)
  );
  svelteHolder.id = "canvas-grid-container";
  // Append app after body
  document.body.insertAdjacentElement("beforeend", svelteHolder);
  // Create app
  const app = new App({
    target: svelteHolder,
    props: { show: showSidebar },
  });
  // Add button to open grid editor
  const button = document.createElement("button");
  button.classList.add("btn", "btn-primary");
  button.innerText = "Open Grid Editor";
  button.addEventListener("click", () => {
    showSidebar.update((v) => !v);
  });
  document.querySelector("#main")?.insertAdjacentElement("beforeend", button);
  // Inject our styles into the TinyMCE editor
  const editorStyles = document.createElement("style");
  editorStyles.innerHTML = tinyMCEStyles;
  window.tinymce.activeEditor
    .getBody()
    .insertAdjacentElement("beforebegin", editorStyles);

  // Prevent TinyMCE from deleting our columns and rows
  window.tinymce.activeEditor.on("keydown", function (e) {
    //prevent empty panels
    if (e.key === "Backspace" || e.key === "Delete") {
      try {
        var elem = window.tinymce.activeEditor.selection.getNode()
          .parentNode as HTMLElement; //current caret node
        if (
          elem &&
          elem.closest(".canvas-grid-editor") &&
          elem.textContent?.length == 0
        ) {
          e.preventDefault();
          return false;
        }
      } catch (e) {}
    }
  });
};

window.addEventListener("load", loadApp);
