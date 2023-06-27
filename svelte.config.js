import sveltePreprocess from "svelte-preprocess";

// Postcss
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindConfig from "./tailwind.config.cjs";
import tailwindNesting from "@tailwindcss/nesting";
import PostCSSImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssFor from "postcss-for";
import postcssEditorStyles from "postcss-editor-styles";
import excludeFiles from "postcss-exclude-files";

const excludeFilesPlugin = excludeFiles.default;

export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
    postcss: true,
  }),
  // vitePlugin: {
  //   prebundleSvelteLibraries: false,
  //   disableDependencyReinclusion: ["svelte-awesome-color-picker"],
  // },
};
