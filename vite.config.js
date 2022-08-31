import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    origin: "http://localhost:5173",
  },
  build: {
    target: "es2018",
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "CanvasGrid",
      // the proper extensions will be added
      fileName: "canvas-grid",
    },
  },
});
