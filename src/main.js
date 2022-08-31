import "./app.css";
import App from "./App.svelte";

window.addEventListener("load", function () {
  // Build DIV to contain app
  const svelteHolder = document.createElement("div");
  svelteHolder.id = "canvas-grid-container";

  // Catch events to prevent bubbling issues
  const cancelPropagation = (e) => {
    console.log("Caught propagation!");
    e.stopPropagation();
    return false;
  };
  // Taken from Canvas
  const events = [
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
    "gesturestart",
    "mousedown",
    "mouseup",
    "mouseover",
    "mousemove",
    "mouseout",
    "click",
    "selectstart",
    "input",
    "contextmenu",
    "change",
    "transitionend",
    "transitioncancel",
    "drag",
    "dragstart",
    "dragend",
    "dragenter",
    "dragleave",
    "dragover",
    "drop",
    "keyup",
    "submit",
  ];
  events.forEach((event) => {
    console.log("bound event:", event);
    svelteHolder.addEventListener(event, cancelPropagation);
  });

  // Prepend before editor
  document
    .querySelector(".edit-content #tinymce-parent-of-wiki_page_body")
    .insertAdjacentElement("beforebegin", svelteHolder);

  // Create app
  const app = new App({
    target: svelteHolder,
  });
  app.$on("click", handleProp);
  app.$on("mouseDown", handleProp);
  app.$on("submit", handleProp);
  console.log("Test");
  // export default app;
});
