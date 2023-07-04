import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.ts";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "theme") {
    return {
      plugins: [
        svelte({
          emitCss: true,
        }),
      ],
      server: {
        origin: "http://localhost:5173",
        hmr: {
          port: 5175,
        },
      },
      build: {
        target: "es2018",
        lib: {
          entry: resolve(__dirname, "src/main.ts"),
          name: "CanvasBlocks",
          // formats: ["iife"],
          formats: ["umd"],
          // the proper extensions will be added
          fileName: "canvas-blocks",
        },
        rollupOptions: {
          output: {
            assetFileNames: "canvas-blocks.[ext]",
            entryFileNames: "canvas-blocks.min.js",
          },
        },
        // watch: true
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
      },
      envPrefix: "CANVAS_BLOCKS_",
    };
  }
  return {
    plugins: [
      svelte({
        emitCss: true,
      }),
      crx({
        manifest,
        injectCss: true,
      }),
    ].concat(
      mode === "beta"
        ? [
            visualizer({
              filename: "./dist/stats.html",
            }),
          ]
        : []
    ),
    server: {
      origin: "http://localhost:5173",
      hmr: {
        port: 5175,
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
    },
    envPrefix: "CANVAS_BLOCKS_",
  };
});
