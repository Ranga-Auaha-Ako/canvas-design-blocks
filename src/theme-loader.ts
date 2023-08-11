/**
 * Canvas Design Blocks Starts
 */
const script = document.createElement("script");
script.src = `${import.meta.env.CANVAS_BLOCKS_THEME_HOST}${
  import.meta.env.CANVAS_BLOCKS_BUILD_DEV === "true"
    ? "src/main.ts"
    : "canvas-blocks.min.js"
}?v=${__APP_VERSION__}`;
script.type = "module";
(document.head || document.documentElement).appendChild(script);
/**
 * Canvas Design Blocks Ends
 */
