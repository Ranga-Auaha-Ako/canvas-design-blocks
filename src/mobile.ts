// Runs on the Canvas native app, and loads only client-side managers
import { version } from "$lib/util/constants";

// These are required for client-side elements to load
import gtag from "$lib/util/gtag";
// Base styles
import "$lib/util/tailwind.postcss";
import "virtual:blocks-icons.css";
import "./app.postcss";
import { clientManagers } from "./shared";

export async function loadApp() {
  // Track users who view content made with DesignBlocks
  if (document.querySelector("div[data-cdb-version]")) {
    gtag("event", "design_blocks_viewer", {
      event_category: "Design Blocks",
      cdb_version: version,
    });
  }
  // Load any client-side elements
  clientManagers.forEach((manager) => {
    manager.renderClientComponent();
  });
}

// Load the app
switch (document.readyState) {
  case "loading":
    window.addEventListener("DOMContentLoaded", () => loadApp());
    break;
  case "interactive":
  case "complete":
    loadApp();
    break;
}
