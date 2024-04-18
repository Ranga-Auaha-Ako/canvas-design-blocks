/**
 * Canvas Design Blocks Starts
 */
const version = import.meta.env.MODE.includes("mobile")
  ? "canvas-blocks-mobile"
  : "canvas-blocks";
const script = document.createElement("script");
script.src = `${
  import.meta.env.BASE_URL
}${version}.min.js?v=${__APP_VERSION__}`;
script.type = "module";
(document.head || document.documentElement).appendChild(script);
/**
 * Canvas Design Blocks Ends
 */
