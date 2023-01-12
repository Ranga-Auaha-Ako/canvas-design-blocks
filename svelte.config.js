import sveltePreprocess from "svelte-preprocess";

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
