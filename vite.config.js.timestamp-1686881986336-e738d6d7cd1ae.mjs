// vite.config.js
import { resolve } from "path";
import { defineConfig } from "file:///Users/zmil425/Documents/Git/canvas-grid-builder/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///Users/zmil425/Documents/Git/canvas-grid-builder/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import path from "path";
import { visualizer } from "file:///Users/zmil425/Documents/Git/canvas-grid-builder/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { crx } from "file:///Users/zmil425/Documents/Git/canvas-grid-builder/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.ts
import { defineManifest } from "file:///Users/zmil425/Documents/Git/canvas-grid-builder/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// package.json
var package_default = {
  name: "canvas-design-blocks",
  version: "2.2.0",
  type: "module",
  license: "GPL-3.0-or-later",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview",
    zip: "vite build && cd ./dist/ && bestzip bundle.zip icon/* canvas-extend.js canvas-blocks.min.js canvas-grid.umd.cjs favicon.png favicon.svg manifest.json popup.html",
    "zip-beta": "vite build && cd ./dist/ && mkdir -p pkg && rimraf ./pkg/* && cp -r icon canvas-extend.js canvas-blocks.min.js canvas-grid.umd.cjs favicon.png favicon.svg manifest.beta.json popup.html ./pkg && mv ./pkg/manifest.beta.json ./pkg/manifest.json && cd pkg && bestzip bundle.beta.zip ./*"
  },
  devDependencies: {
    "@crxjs/vite-plugin": "^2.0.0-beta.17",
    "@floating-ui/dom": "1.3.0",
    "@sveltejs/vite-plugin-svelte": "2.4.1",
    "@tailwindcss/forms": "^0.5.3",
    "@tailwindcss/nesting": "^0.0.0-insiders.565cd3e",
    "@types/css": "^0.0.33",
    "@types/to-px": "^1.1.2",
    autoprefixer: "10.4.14",
    bestzip: "^2.2.1",
    colord: "^2.9.3",
    dotenv: "^16.1.4",
    "html-void-elements": "3.0.0",
    nanoid: "4.0.2",
    postcss: "8.4.24",
    "postcss-editor-styles": "^0.3.0",
    "postcss-exclude-files": "^1.0.15",
    "postcss-for": "^2.1.1",
    "postcss-import": "^15.0.0",
    "postcss-load-config": "^4.0.1",
    "postcss-nesting": "11.3.0",
    rimraf: "5.0.1",
    "rollup-plugin-visualizer": "5.9.2",
    sass: "1.63.4",
    svelte: "3.59.1",
    "svelte-local-storage-store": "0.5.0",
    "svelte-preprocess": "^5.0.4",
    "svelte-use-click-outside": "^1.0.0",
    "svelte-writable-derived": "^3.1.0",
    tailwindcss: "3.3.2",
    tinymce: "5.10",
    "to-px": "^1.1.0",
    typescript: "5.1.3",
    vite: "^4.3.9"
  },
  dependencies: {}
};

// manifest.ts
import "file:///Users/zmil425/Documents/Git/canvas-grid-builder/node_modules/dotenv/config.js";
var { version } = package_default;
var _a;
var BaseDomains = ((_a = process.env.CANVAS_BLOCKS_BASE_DOMAINS) == null ? void 0 : _a.split(
  ","
)) ?? ["canvas.auckland.ac.nz"];
var [major, minor, patch, label = "0"] = version.replace(/[^\d.-]+/g, "").split(/[.-]/);
var manifest_default = defineManifest(async (env) => ({
  manifest_version: 3,
  name: env.mode === "staging" ? "[INTERNAL] Canvas Design Blocks" : "Canvas Design Blocks",
  homepage_url: "https://teachwell.auckland.ac.nz/",
  host_permissions: BaseDomains.map((d) => `*://${d}/*`),
  permissions: ["storage"],
  short_name: "Design Blocks",
  description: "Quickly create and edit pages, creating grids and other elements without using the HTML editor.",
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}.${label}`,
  // semver is OK in "version_name"
  version_name: version,
  action: {
    default_icon: env.mode === "staging" ? {
      "16": "icon/beta/logo_icon_16.png",
      "24": "icon/beta/logo_icon_24.png",
      "32": "icon/beta/logo_icon_32.png"
    } : {
      "16": "icon/logo_icon_16.png",
      "24": "icon/logo_icon_24.png",
      "32": "icon/logo_icon_32.png"
    },
    default_title: "Canvas Design Blocks"
  },
  icons: env.mode === "staging" ? {
    "16": "icon/logo_icon_16.png",
    "32": "icon/logo_icon_32.png",
    "48": "icon/logo_icon_48.png",
    "128": "icon/logo_icon_128.png"
  } : {
    "16": "icon/beta/logo_icon_16.png",
    "32": "icon/beta/logo_icon_32.png",
    "48": "icon/beta/logo_icon_48.png",
    "128": "icon/beta/logo_icon_128.png"
  },
  author: "raa@auckland.ac.nz",
  web_accessible_resources: [
    {
      matches: BaseDomains.map((d) => `*://${d}/*`),
      resources: ["src/main.ts"]
    }
  ],
  content_scripts: [
    {
      matches: BaseDomains.map((d) => `*://${d}/*`),
      js: ["src/canvas-extend.ts"],
      css: []
    }
  ]
}));

// vite.config.js
var __vite_injected_original_dirname = "/Users/zmil425/Documents/Git/canvas-grid-builder";
var vite_config_default = defineConfig({
  plugins: [
    svelte({
      emitCss: true
    }),
    visualizer({
      filename: "./dist/stats.html"
    }),
    crx({
      manifest: manifest_default
    })
  ],
  server: {
    origin: "http://localhost:5173",
    hmr: {
      port: 5175
    }
  },
  build: {
    target: "es2018",
    cssCodeSplit: false,
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/main.ts"),
      name: "CanvasBlocks",
      formats: ["iife"],
      // formats: ["es"],
      // the proper extensions will be added
      fileName: "canvas-blocks"
    },
    rollupOptions: {
      output: {
        assetFileNames: "canvas-blocks.[ext]",
        entryFileNames: "canvas-blocks.min.js"
      }
    }
    // watch: true
  },
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      $assets: path.resolve("./src/assets")
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version) || "unknown",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
  },
  envPrefix: "CANVAS_BLOCKS_"
  // optimizeDeps: {
  //   exclude: ["svelte-awesome-color-picker"],
  // },
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAibWFuaWZlc3QudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3ptaWw0MjUvRG9jdW1lbnRzL0dpdC9jYW52YXMtZ3JpZC1idWlsZGVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvem1pbDQyNS9Eb2N1bWVudHMvR2l0L2NhbnZhcy1ncmlkLWJ1aWxkZXIvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3ptaWw0MjUvRG9jdW1lbnRzL0dpdC9jYW52YXMtZ3JpZC1idWlsZGVyL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSBcIkBzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiO1xuaW1wb3J0IHsgY3J4IH0gZnJvbSBcIkBjcnhqcy92aXRlLXBsdWdpblwiO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gXCIuL21hbmlmZXN0LnRzXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgc3ZlbHRlKHtcbiAgICAgIGVtaXRDc3M6IHRydWUsXG4gICAgfSksXG4gICAgdmlzdWFsaXplcih7XG4gICAgICBmaWxlbmFtZTogXCIuL2Rpc3Qvc3RhdHMuaHRtbFwiLFxuICAgIH0pLFxuICAgIGNyeCh7XG4gICAgICBtYW5pZmVzdCxcbiAgICB9KSxcbiAgXSxcbiAgc2VydmVyOiB7XG4gICAgb3JpZ2luOiBcImh0dHA6Ly9sb2NhbGhvc3Q6NTE3M1wiLFxuICAgIGhtcjoge1xuICAgICAgcG9ydDogNTE3NSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJlczIwMThcIixcbiAgICBjc3NDb2RlU3BsaXQ6IGZhbHNlLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9tYWluLnRzXCIpLFxuICAgICAgbmFtZTogXCJDYW52YXNCbG9ja3NcIixcbiAgICAgIGZvcm1hdHM6IFtcImlpZmVcIl0sXG4gICAgICAvLyBmb3JtYXRzOiBbXCJlc1wiXSxcbiAgICAgIC8vIHRoZSBwcm9wZXIgZXh0ZW5zaW9ucyB3aWxsIGJlIGFkZGVkXG4gICAgICBmaWxlTmFtZTogXCJjYW52YXMtYmxvY2tzXCIsXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IFwiY2FudmFzLWJsb2Nrcy5bZXh0XVwiLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJjYW52YXMtYmxvY2tzLm1pbi5qc1wiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIHdhdGNoOiB0cnVlXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJGxpYjogcGF0aC5yZXNvbHZlKFwiLi9zcmMvbGliXCIpLFxuICAgICAgJGFzc2V0czogcGF0aC5yZXNvbHZlKFwiLi9zcmMvYXNzZXRzXCIpLFxuICAgIH0sXG4gIH0sXG4gIGRlZmluZToge1xuICAgIF9fQVBQX1ZFUlNJT05fXzpcbiAgICAgIEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24pIHx8IFwidW5rbm93blwiLFxuICAgIFwicHJvY2Vzcy5lbnYuTk9ERV9FTlZcIjogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYpLFxuICB9LFxuICBlbnZQcmVmaXg6IFwiQ0FOVkFTX0JMT0NLU19cIixcbiAgLy8gb3B0aW1pemVEZXBzOiB7XG4gIC8vICAgZXhjbHVkZTogW1wic3ZlbHRlLWF3ZXNvbWUtY29sb3ItcGlja2VyXCJdLFxuICAvLyB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy96bWlsNDI1L0RvY3VtZW50cy9HaXQvY2FudmFzLWdyaWQtYnVpbGRlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3ptaWw0MjUvRG9jdW1lbnRzL0dpdC9jYW52YXMtZ3JpZC1idWlsZGVyL21hbmlmZXN0LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy96bWlsNDI1L0RvY3VtZW50cy9HaXQvY2FudmFzLWdyaWQtYnVpbGRlci9tYW5pZmVzdC50c1wiO2ltcG9ydCB7IGRlZmluZU1hbmlmZXN0IH0gZnJvbSBcIkBjcnhqcy92aXRlLXBsdWdpblwiO1xuaW1wb3J0IHBhY2thZ2VKc29uIGZyb20gXCIuL3BhY2thZ2UuanNvblwiO1xuY29uc3QgeyB2ZXJzaW9uIH0gPSBwYWNrYWdlSnNvbjtcbmltcG9ydCBcImRvdGVudi9jb25maWdcIjtcblxuLy8gTG9hZCBiYXNlZG9tYWlucyBmcm9tIENBTlZBU19CTE9DS1NfQkFTRV9ET01BSU5TIGVudmlyb25tZW50IHZhcmlhYmxlXG5jb25zdCBCYXNlRG9tYWluczogc3RyaW5nW10gPSBwcm9jZXNzLmVudi5DQU5WQVNfQkxPQ0tTX0JBU0VfRE9NQUlOUz8uc3BsaXQoXG4gIFwiLFwiXG4pID8/IFtcImNhbnZhcy5hdWNrbGFuZC5hYy5uelwiXTtcblxuLy8gQ29udmVydCBmcm9tIFNlbXZlciAoZXhhbXBsZTogMC4xLjAtYmV0YTYpXG5jb25zdCBbbWFqb3IsIG1pbm9yLCBwYXRjaCwgbGFiZWwgPSBcIjBcIl0gPSB2ZXJzaW9uXG4gIC8vIGNhbiBvbmx5IGNvbnRhaW4gZGlnaXRzLCBkb3RzLCBvciBkYXNoXG4gIC5yZXBsYWNlKC9bXlxcZC4tXSsvZywgXCJcIilcbiAgLy8gc3BsaXQgaW50byB2ZXJzaW9uIHBhcnRzXG4gIC5zcGxpdCgvWy4tXS8pO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVNYW5pZmVzdChhc3luYyAoZW52KSA9PiAoe1xuICBtYW5pZmVzdF92ZXJzaW9uOiAzLFxuICBuYW1lOlxuICAgIGVudi5tb2RlID09PSBcInN0YWdpbmdcIlxuICAgICAgPyBcIltJTlRFUk5BTF0gQ2FudmFzIERlc2lnbiBCbG9ja3NcIlxuICAgICAgOiBcIkNhbnZhcyBEZXNpZ24gQmxvY2tzXCIsXG4gIGhvbWVwYWdlX3VybDogXCJodHRwczovL3RlYWNod2VsbC5hdWNrbGFuZC5hYy5uei9cIixcbiAgaG9zdF9wZXJtaXNzaW9uczogQmFzZURvbWFpbnMubWFwKChkKSA9PiBgKjovLyR7ZH0vKmApLFxuICBwZXJtaXNzaW9uczogW1wic3RvcmFnZVwiXSxcbiAgc2hvcnRfbmFtZTogXCJEZXNpZ24gQmxvY2tzXCIsXG4gIGRlc2NyaXB0aW9uOlxuICAgIFwiUXVpY2tseSBjcmVhdGUgYW5kIGVkaXQgcGFnZXMsIGNyZWF0aW5nIGdyaWRzIGFuZCBvdGhlciBlbGVtZW50cyB3aXRob3V0IHVzaW5nIHRoZSBIVE1MIGVkaXRvci5cIixcbiAgLy8gdXAgdG8gZm91ciBudW1iZXJzIHNlcGFyYXRlZCBieSBkb3RzXG4gIHZlcnNpb246IGAke21ham9yfS4ke21pbm9yfS4ke3BhdGNofS4ke2xhYmVsfWAsXG4gIC8vIHNlbXZlciBpcyBPSyBpbiBcInZlcnNpb25fbmFtZVwiXG4gIHZlcnNpb25fbmFtZTogdmVyc2lvbixcbiAgYWN0aW9uOiB7XG4gICAgZGVmYXVsdF9pY29uOlxuICAgICAgZW52Lm1vZGUgPT09IFwic3RhZ2luZ1wiXG4gICAgICAgID8ge1xuICAgICAgICAgICAgXCIxNlwiOiBcImljb24vYmV0YS9sb2dvX2ljb25fMTYucG5nXCIsXG4gICAgICAgICAgICBcIjI0XCI6IFwiaWNvbi9iZXRhL2xvZ29faWNvbl8yNC5wbmdcIixcbiAgICAgICAgICAgIFwiMzJcIjogXCJpY29uL2JldGEvbG9nb19pY29uXzMyLnBuZ1wiLFxuICAgICAgICAgIH1cbiAgICAgICAgOiB7XG4gICAgICAgICAgICBcIjE2XCI6IFwiaWNvbi9sb2dvX2ljb25fMTYucG5nXCIsXG4gICAgICAgICAgICBcIjI0XCI6IFwiaWNvbi9sb2dvX2ljb25fMjQucG5nXCIsXG4gICAgICAgICAgICBcIjMyXCI6IFwiaWNvbi9sb2dvX2ljb25fMzIucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICBkZWZhdWx0X3RpdGxlOiBcIkNhbnZhcyBEZXNpZ24gQmxvY2tzXCIsXG4gIH0sXG4gIGljb25zOlxuICAgIGVudi5tb2RlID09PSBcInN0YWdpbmdcIlxuICAgICAgPyB7XG4gICAgICAgICAgXCIxNlwiOiBcImljb24vbG9nb19pY29uXzE2LnBuZ1wiLFxuICAgICAgICAgIFwiMzJcIjogXCJpY29uL2xvZ29faWNvbl8zMi5wbmdcIixcbiAgICAgICAgICBcIjQ4XCI6IFwiaWNvbi9sb2dvX2ljb25fNDgucG5nXCIsXG4gICAgICAgICAgXCIxMjhcIjogXCJpY29uL2xvZ29faWNvbl8xMjgucG5nXCIsXG4gICAgICAgIH1cbiAgICAgIDoge1xuICAgICAgICAgIFwiMTZcIjogXCJpY29uL2JldGEvbG9nb19pY29uXzE2LnBuZ1wiLFxuICAgICAgICAgIFwiMzJcIjogXCJpY29uL2JldGEvbG9nb19pY29uXzMyLnBuZ1wiLFxuICAgICAgICAgIFwiNDhcIjogXCJpY29uL2JldGEvbG9nb19pY29uXzQ4LnBuZ1wiLFxuICAgICAgICAgIFwiMTI4XCI6IFwiaWNvbi9iZXRhL2xvZ29faWNvbl8xMjgucG5nXCIsXG4gICAgICAgIH0sXG4gIGF1dGhvcjogXCJyYWFAYXVja2xhbmQuYWMubnpcIixcbiAgd2ViX2FjY2Vzc2libGVfcmVzb3VyY2VzOiBbXG4gICAge1xuICAgICAgbWF0Y2hlczogQmFzZURvbWFpbnMubWFwKChkKSA9PiBgKjovLyR7ZH0vKmApLFxuICAgICAgcmVzb3VyY2VzOiBbXCJzcmMvbWFpbi50c1wiXSxcbiAgICB9LFxuICBdLFxuXG4gIGNvbnRlbnRfc2NyaXB0czogW1xuICAgIHtcbiAgICAgIG1hdGNoZXM6IEJhc2VEb21haW5zLm1hcCgoZCkgPT4gYCo6Ly8ke2R9LypgKSxcbiAgICAgIGpzOiBbXCJzcmMvY2FudmFzLWV4dGVuZC50c1wiXSxcbiAgICAgIGNzczogW10sXG4gICAgfSxcbiAgXSxcbn0pKTtcbiIsICJ7XG4gIFwibmFtZVwiOiBcImNhbnZhcy1kZXNpZ24tYmxvY2tzXCIsXG4gIFwidmVyc2lvblwiOiBcIjIuMi4wXCIsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcImxpY2Vuc2VcIjogXCJHUEwtMy4wLW9yLWxhdGVyXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcInByZXZpZXdcIjogXCJ2aXRlIHByZXZpZXdcIixcbiAgICBcInppcFwiOiBcInZpdGUgYnVpbGQgJiYgY2QgLi9kaXN0LyAmJiBiZXN0emlwIGJ1bmRsZS56aXAgaWNvbi8qIGNhbnZhcy1leHRlbmQuanMgY2FudmFzLWJsb2Nrcy5taW4uanMgY2FudmFzLWdyaWQudW1kLmNqcyBmYXZpY29uLnBuZyBmYXZpY29uLnN2ZyBtYW5pZmVzdC5qc29uIHBvcHVwLmh0bWxcIixcbiAgICBcInppcC1iZXRhXCI6IFwidml0ZSBidWlsZCAmJiBjZCAuL2Rpc3QvICYmIG1rZGlyIC1wIHBrZyAmJiByaW1yYWYgLi9wa2cvKiAmJiBjcCAtciBpY29uIGNhbnZhcy1leHRlbmQuanMgY2FudmFzLWJsb2Nrcy5taW4uanMgY2FudmFzLWdyaWQudW1kLmNqcyBmYXZpY29uLnBuZyBmYXZpY29uLnN2ZyBtYW5pZmVzdC5iZXRhLmpzb24gcG9wdXAuaHRtbCAuL3BrZyAmJiBtdiAuL3BrZy9tYW5pZmVzdC5iZXRhLmpzb24gLi9wa2cvbWFuaWZlc3QuanNvbiAmJiBjZCBwa2cgJiYgYmVzdHppcCBidW5kbGUuYmV0YS56aXAgLi8qXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGNyeGpzL3ZpdGUtcGx1Z2luXCI6IFwiXjIuMC4wLWJldGEuMTdcIixcbiAgICBcIkBmbG9hdGluZy11aS9kb21cIjogXCIxLjMuMFwiLFxuICAgIFwiQHN2ZWx0ZWpzL3ZpdGUtcGx1Z2luLXN2ZWx0ZVwiOiBcIjIuNC4xXCIsXG4gICAgXCJAdGFpbHdpbmRjc3MvZm9ybXNcIjogXCJeMC41LjNcIixcbiAgICBcIkB0YWlsd2luZGNzcy9uZXN0aW5nXCI6IFwiXjAuMC4wLWluc2lkZXJzLjU2NWNkM2VcIixcbiAgICBcIkB0eXBlcy9jc3NcIjogXCJeMC4wLjMzXCIsXG4gICAgXCJAdHlwZXMvdG8tcHhcIjogXCJeMS4xLjJcIixcbiAgICBcImF1dG9wcmVmaXhlclwiOiBcIjEwLjQuMTRcIixcbiAgICBcImJlc3R6aXBcIjogXCJeMi4yLjFcIixcbiAgICBcImNvbG9yZFwiOiBcIl4yLjkuM1wiLFxuICAgIFwiZG90ZW52XCI6IFwiXjE2LjEuNFwiLFxuICAgIFwiaHRtbC12b2lkLWVsZW1lbnRzXCI6IFwiMy4wLjBcIixcbiAgICBcIm5hbm9pZFwiOiBcIjQuMC4yXCIsXG4gICAgXCJwb3N0Y3NzXCI6IFwiOC40LjI0XCIsXG4gICAgXCJwb3N0Y3NzLWVkaXRvci1zdHlsZXNcIjogXCJeMC4zLjBcIixcbiAgICBcInBvc3Rjc3MtZXhjbHVkZS1maWxlc1wiOiBcIl4xLjAuMTVcIixcbiAgICBcInBvc3Rjc3MtZm9yXCI6IFwiXjIuMS4xXCIsXG4gICAgXCJwb3N0Y3NzLWltcG9ydFwiOiBcIl4xNS4wLjBcIixcbiAgICBcInBvc3Rjc3MtbG9hZC1jb25maWdcIjogXCJeNC4wLjFcIixcbiAgICBcInBvc3Rjc3MtbmVzdGluZ1wiOiBcIjExLjMuMFwiLFxuICAgIFwicmltcmFmXCI6IFwiNS4wLjFcIixcbiAgICBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiOiBcIjUuOS4yXCIsXG4gICAgXCJzYXNzXCI6IFwiMS42My40XCIsXG4gICAgXCJzdmVsdGVcIjogXCIzLjU5LjFcIixcbiAgICBcInN2ZWx0ZS1sb2NhbC1zdG9yYWdlLXN0b3JlXCI6IFwiMC41LjBcIixcbiAgICBcInN2ZWx0ZS1wcmVwcm9jZXNzXCI6IFwiXjUuMC40XCIsXG4gICAgXCJzdmVsdGUtdXNlLWNsaWNrLW91dHNpZGVcIjogXCJeMS4wLjBcIixcbiAgICBcInN2ZWx0ZS13cml0YWJsZS1kZXJpdmVkXCI6IFwiXjMuMS4wXCIsXG4gICAgXCJ0YWlsd2luZGNzc1wiOiBcIjMuMy4yXCIsXG4gICAgXCJ0aW55bWNlXCI6IFwiNS4xMFwiLFxuICAgIFwidG8tcHhcIjogXCJeMS4xLjBcIixcbiAgICBcInR5cGVzY3JpcHRcIjogXCI1LjEuM1wiLFxuICAgIFwidml0ZVwiOiBcIl40LjMuOVwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHt9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtVLFNBQVMsZUFBZTtBQUMxVixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGNBQWM7QUFDdkIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsV0FBVzs7O0FDTHdTLFNBQVMsc0JBQXNCOzs7QUNBM1Y7QUFBQSxFQUNFLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLFNBQVc7QUFBQSxJQUNULEtBQU87QUFBQSxJQUNQLE9BQVM7QUFBQSxJQUNULFNBQVc7QUFBQSxJQUNYLEtBQU87QUFBQSxJQUNQLFlBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxpQkFBbUI7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
