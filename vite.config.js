import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import getIconsPlugin from "./src/lib/icons/vite/vite-plugin-icons.js";
import vitePluginCanvasStyles from "./lib/vite-plugin-canvas-styles.js";
import parseChangelog from "changelog-parser";
import { compare } from "compare-versions";

const changelog = await parseChangelog("./CHANGELOG.md");
const changeVer = changelog.versions.find(
  (v) =>
    v.version &&
    compare(v.version, process.env.npm_package_version, "<=") &&
    v.parsed.Overview
);

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  if (mode === "sandpit") {
    return {
      base: command === "serve" ? "/" : process.env.CANVAS_BLOCKS_THEME_HOST,
      build: {
        target: "es2018",
        manifest: true,
        cssMinify: "lightningcss",
        emptyOutDir: !(process.env.CLEAR_DIST === "false"),
      },
      plugins: [
        svelte({
          emitCss: true,
        }),
        getIconsPlugin(),
        vitePluginCanvasStyles(),
        visualizer({
          filename: "./dist/stats.html",
        }),
      ],
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
        __LATEST_CHANGE__: JSON.stringify(changeVer?.parsed.Overview),
        __LATEST_CHANGE_VERSION__: JSON.stringify(changeVer.version),
      },
    };
  }
  if (mode === "theme-loader") {
    return {
      base: process.env.CANVAS_BLOCKS_THEME_HOST,
      build: {
        target: "es2018",
        lib: {
          entry: resolve(__dirname, "src/theme-loader.ts"),
          name: "CanvasBlocksLoader",
          formats: ["umd"],
          fileName: "theme-loader",
        },
        emptyOutDir: false,
      },
      define: {
        __APP_VERSION__:
          JSON.stringify(process.env.npm_package_version) || "unknown",
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      },
    };
  }
  return {
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
      __LATEST_CHANGE__: JSON.stringify(changeVer?.parsed.Overview),
      __LATEST_CHANGE_VERSION__: JSON.stringify(changeVer.version),
    },
    base: command === "serve" ? "/" : process.env.CANVAS_BLOCKS_THEME_HOST,
    envPrefix: "CANVAS_BLOCKS_",
    esbuild: {
      banner: `/* Canvas Design Blocks v${process.env.npm_package_version} */`,
    },
    plugins: [
      svelte({
        emitCss: true,
      }),
      getIconsPlugin(),
      vitePluginCanvasStyles(),
      // hoistImportDeps({
      //   baseUrl:
      //     command === "serve"
      //       ? "/"
      //       : process.env.CANVAS_BLOCKS_THEME_HOST || "",
      // }),
    ].concat(
      // @ts-ignore
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
      cssMinify: "lightningcss",
      cssCodeSplit: false,
      rollupOptions: {
        input: "src/main.ts",
        output: {
          format: "es",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name.endsWith(".css")) {
              return "canvas-blocks.css";
            }
            return "a/[hash].[ext]";
          },
          entryFileNames: "canvas-blocks.min.js",
          chunkFileNames: "c/[name]-[hash].js",
          inlineDynamicImports: false,
        },
      },
      // watch: true
    },
  };
});
