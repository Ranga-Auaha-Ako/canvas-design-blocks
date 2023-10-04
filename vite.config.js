import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.ts";
import libAssetsPlugin from "@laynezh/vite-plugin-lib-assets";
import getInstIconsPlugin from "./lib/vite-plugin-inst-icons.js";
import vitePluginCanvasStyles from "./lib/vite-plugin-canvas-styles.js";

/**
 * Returns a shared configuration object for Vite.
 * @param {string} mode - The current mode of Vite.
 * @returns {object} - The shared configuration object.
 */
const shared = (mode) => ({
  server: {
    origin: "http://localhost:5173",
    hmr: {
      port: 5175,
    },
  },
  css: {
    lightningcss: {
      targets: "last 2 versions or >= 0.25%, not dead",
    },
  },
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      $assets: path.resolve("./src/assets"),
    },
  },
  define: {
    __APP_VERSION__:
      JSON.stringify(process.env.npm_package_version) || "unknown",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    __THEME__: JSON.stringify(
      JSON.parse(process.env.CANVAS_BLOCKS_THEME || "{}")
    ),
  },
  envPrefix: "CANVAS_BLOCKS_",
});
const sharedPlugins = [
  svelte({
    emitCss: true,
  }),
  getInstIconsPlugin(),
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "theme-loader") {
    return {
      ...shared(mode),
      plugins: [...sharedPlugins, libAssetsPlugin(), vitePluginCanvasStyles()],

      build: {
        target: "es2018",
        lib: {
          entry: resolve(__dirname, "src/theme-loader.ts"),
          name: "CanvasBlocksLoader",
          // formats: ["iife"],
          formats: ["umd"],
          // the proper extensions will be added
          fileName: "theme-loader",
        },
        emptyOutDir: false,
      },
    };
  } else if (mode === "extension") {
    return {
      ...shared(mode),
      plugins: [
        ...sharedPlugins,
        crx({
          manifest,
          injectCss: true,
        }),
        vitePluginCanvasStyles(),
      ].concat(
        mode === "beta"
          ? [
              visualizer({
                filename: "./dist/stats.html",
              }),
            ]
          : []
      ),
    };
  } else {
    return {
      ...shared(mode),
      plugins: [
        ...sharedPlugins,
        libAssetsPlugin({
          publicUrl: process.env.CANVAS_BLOCKS_THEME_HOST || "",
          name: "[contenthash].[ext]",
        }),
        vitePluginCanvasStyles(),
      ].concat(
        mode.includes("beta")
          ? [
              visualizer({
                filename: "./dist/stats.html",
              }),
            ]
          : []
      ),
      build: {
        target: "es2018",
        manifest: true,
        minify: true,
        lib: {
          entry: resolve(__dirname, "src/main.ts"),
          name: "CanvasBlocks",
          // formats: ["es"],
          formats: ["umd"],
          // the proper extensions will be added
          fileName: "canvas-blocks",
        },
        cssMinify: "lightningcss",
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              if (assetInfo.name.endsWith(".css")) {
                return "canvas-blocks.css";
              }
              return "[hash].[ext]";
            },
            entryFileNames: "canvas-blocks.min.js",
          },
        },
        // watch: true
      },
    };
  }
});
