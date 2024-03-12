import { writable } from "svelte/store";
import type { Editor } from "tinymce";
import "./app.postcss";
import "virtual:blocks-icons.css";
import blockStyles from "virtual:blocks-icons-editor-styles";
import "$lib/util/tailwind.postcss";
import tailwindStyles from "$lib/util/tailwind.base.postcss?inline";
import Toolbar from "./entrypoints/Toolbar.svelte";
import type { Writable } from "svelte/store";
import { SvelteComponent } from "svelte";
import { version } from "$lib/util/constants";
import { compareVersions } from "compare-versions";
import type ElementManager from "$lib/elements/generic/elementManager";
import ImageCardManager from "$lib/elements/imageCard/imageCardManager";
import gtag from "$lib/util/gtag";
import glossaryClientManager from "$lib/elements/glossary/glossaryClientManager";
import GlossaryToolbarPanel from "$lib/elements/glossary/glossaryToolbarPanel.svelte";

if (import.meta.env.DEV && document.location.hostname === "localhost") {
  await import("virtual:inst-env");
}

export interface stateObject {
  showInterface: Writable<boolean>;
  configComponent: Writable<{
    component: typeof SvelteComponent<any>;
    props: Record<string, any>;
  } | null>;
}

const state: stateObject = {
  showInterface: writable(false),
  configComponent: writable(null),
};

if (import.meta.env.DEV) {
  console.log("Dev mode enabled");
  window.onbeforeunload = function () {};
  // state.showInterface.set(true);
}

let attempts = 0;
let hasLoaded = false;
export const getEditor = () =>
  new Promise<Editor>((resolve, reject) => {
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

let loaded_blocks: ElementManager[] = [];

// Client manager is not loaded conditionally
const clientManagers: { renderClientComponent: () => unknown }[] = [
  glossaryClientManager,
];

export const loadApp = async () => {
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

  // If tool is already loaded, exit
  // Get TinyMCE Editor
  const editor = await getEditor().catch((e) => {
    console.error(e);
    return null;
  });
  if (!editor) return;

  // Code after this point will only run if the editor is loaded
  // Editor managers are loaded conditionally to reduce bundle size
  const { editorManagers, legacyManagers } = await import(
    "$lib/elements/loader"
  );
  loaded_blocks = editorManagers.map((m) => new m(state, editor));

  // Migrate old blocks
  new legacyManagers.ImageCardLegacy(
    state,
    editor,
    loaded_blocks[2] as ImageCardManager
  );

  // Add button to open grid editor
  const toolbar = loadToolbar({
    state,
    managers: loaded_blocks,
    additionalItems: [GlossaryToolbarPanel],
  });

  // Inject tailwind base styles into editor
  const pageStylesEl = editor.getDoc().createElement("style");
  pageStylesEl.innerHTML = tailwindStyles + blockStyles;
  editor.getBody().insertAdjacentElement("beforebegin", pageStylesEl);

  // Add class to page body when toolbar is open
  state.showInterface.subscribe((show) => {
    if (show) {
      document.body.classList.add("cdb-toolbar-open");
    } else {
      document.body.classList.remove("cdb-toolbar-open");
    }
  });
  // Handle dragging elements into the editor.
  editor.getContainer().addEventListener("dragover", (e) => {});
  editor.on(
    "drop",
    (e) => {
      const { dataTransfer } = e;
      if (dataTransfer?.types.includes("cdb-element/name")) {
        editor.focus();
        const blockName = dataTransfer.getData("cdb-element/name");
        const blockId = dataTransfer.getData("cdb-element/id");
        const block = loaded_blocks.find((b) => b.elementName === blockName);
        if (block && blockName && blockId) {
          setTimeout(() => {
            const insertedEl = editor.dom.doc.getElementById(blockId);
            if (insertedEl) {
              editor.selection.select(insertedEl);
              editor.selection.collapse(false);
              block.create(true);
              insertedEl.remove();
            }
          }, 50);
        }
      }
    },
    true
  );
  // Hide app when TinyMCE editor is removed
  editor.on("detach", () => {
    console.log("Editor removed");
    toolbar?.$destroy();
    // Load the app again when the editor is reloaded
    setTimeout(() => {
      loadApp();
    }, 100);
  });
  // Register unload function
  window._UNLOAD_DESIGNBLOCKS = () => {
    if (hasLoaded) {
      console.log(`Unloading app: ${__APP_VERSION__}`);
      toolbar?.$destroy();
      loaded_blocks.forEach((block) => block.detatch());
      hasLoaded = false;
      return true;
    }
    return false;
  };
};

const beginLaunch = () => {
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

    switch (document.readyState) {
      case "loading":
        window.addEventListener("DOMContentLoaded", loadApp);
        break;
      case "interactive":
      case "complete":
        loadApp();
        break;
    }

    // Load the app only on certain pages
    // const loc = window.location.pathname;
    // if (/pages\/?$|pages\/.+\/edit$/.test(loc)) {
    // }
  } else {
    console.log("App already loaded");
  }
};

beginLaunch();
