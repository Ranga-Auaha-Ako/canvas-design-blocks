/**
 * Canvas Design Blocks Starts
 */
const script = document.createElement("script");
script.src = `${
  import.meta.env.CANVAS_BLOCKS_THEME_HOST
}theme.js?${Date.now()}`;
script.type = "module";
(document.head || document.documentElement).appendChild(script);
/**
 * Canvas Design Blocks Ends
 */
