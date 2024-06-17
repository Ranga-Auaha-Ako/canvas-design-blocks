import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import getIconsPlugin from "./src/lib/icons/vite/vite-plugin-icons.js";
import vitePluginCanvasStyles from "./lib/vite-plugin-canvas-styles.js";
import parseChangelog from "changelog-parser";
import { compare } from "compare-versions";
import browserslistToEsbuild from "browserslist-to-esbuild";

const changelog = await parseChangelog("./CHANGELOG.md");
const changeVer = changelog.versions.find(
  (v) =>
    v.version &&
    compare(v.version, process.env.npm_package_version, "<=") &&
    v.parsed.Overview
);

const visualizers = [
  {
    filename: "./dist/flame.html",
    template: "flamegraph",
  },
  {
    filename: "./dist/stats.html",
    template: "treemap",
  },
  {
    filename: "./dist/network.html",
    template: "network",
  },
];

/**
 * Generates the configuration object for the application.
 *
 * @param {"desktop" | "mobile"} launchFile - The name of the launch file.
 * @returns {import('vite').UserConfig} The configuration object.
 */
const appConfig = (launchFile, { mode, command }) => {
  return {
    server: {
      origin: "http://localhost:5173",
      hmr: {
        port: 5175,
      },
    },
    // css: {
    // lightningcss: {
    //   targets: browserslistToTargets(
    //     browserslist("last 2 versions or >= 0.25%, not dead")
    //   ),
    // },
    // },
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
    ].concat(
      // @ts-ignore
      mode.includes("beta")
        ? visualizers.map((v) =>
            visualizer({
              ...v,
              brotliSize: true,
            })
          )
        : []
    ),
    build: {
      // target: browserslist("last 2 versions or >= 0.25%, not dead"),
      // target: "es2018",
      target: browserslistToEsbuild("last 2 versions or >= 0.25%, not dead"),
      manifest: true,
      cssMinify: "lightningcss",
      cssCodeSplit: false,
      emptyOutDir: launchFile === "desktop",
      rollupOptions: {
        input: `src/${launchFile}.ts`,
        output: {
          format: "es",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name.endsWith(".css")) {
              return launchFile === "desktop"
                ? "canvas-blocks.css"
                : `canvas-blocks-${launchFile}.css`;
            }
            return `a-${launchFile}/[hash].[ext]`;
          },
          entryFileNames:
            launchFile === "desktop"
              ? "canvas-blocks.min.js"
              : "canvas-blocks-mobile.min.js",
          chunkFileNames: `c-${launchFile}/[name]-[hash].js`,
          inlineDynamicImports: false,
          manualChunks: {
            icons: ["virtual:blocks-icons"],
            sortable: ["sortablejs"],
          },
        },
      },
      // watch: true
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  if (mode === "sandpit") {
    return {
      base: command === "serve" ? "/" : process.env.CANVAS_BLOCKS_THEME_HOST,
      build: {
        target: browserslistToEsbuild("last 2 versions or >= 0.25%, not dead"),
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
        ...visualizers.map((v) =>
          visualizer({
            ...v,
            brotliSize: true,
          })
        ),
      ],
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
  if (mode.includes("theme-loader")) {
    return {
      base: process.env.CANVAS_BLOCKS_THEME_HOST,
      build: {
        target: "es2018",
        lib: {
          entry: resolve(__dirname, "src/theme-loader.ts"),
          name: "CanvasBlocksLoader",
          formats: ["umd"],
          fileName: mode.includes("mobile")
            ? "theme-loader-mobile"
            : "theme-loader",
        },
        emptyOutDir: false,
      },
      define: {
        __APP_NAME__: JSON.stringify(
          mode.includes("mobile") ? "canvas-blocks-mobile" : "canvas-blocks"
        ),
        __APP_VERSION__:
          JSON.stringify(process.env.npm_package_version) || "unknown",
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      },
    };
  }
  if (mode.includes("mobile")) return appConfig("mobile", { mode, command });
  return appConfig("desktop", { mode, command });
});
