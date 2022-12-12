import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import tailwindConfig from "./tailwind.config.cjs";
import tailwindNesting from "@tailwindcss/nesting";
import PostCSSImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssFor from "postcss-for";
import postcssEditorStyles from "postcss-editor-styles";

export default {
  plugins: [
    //Some plugins, like tailwindcss/nesting, need to run before Tailwind,
    PostCSSImport(),
    postcssFor(),
    tailwindNesting(postcssNesting),
    tailwind(tailwindConfig),
    //But others, like autoprefixer, need to run after,
    autoprefixer,
    // Postcss Editor Styles : Desipte the name, this plugin is used to prefix
    // the CSS with a custom selector, so that it only applies to a div.
    // This is used to prevent the CSS from affecting the rest of Canvas, but means
    // We need to wrap any component in a .cgb-component div.
    postcssEditorStyles({
      scopeTo: ".cgb-component",
      // These would be used to potentially not apply to nested elements controlled
      // by Canvas. We don't have those, so set to nothing.
      tags: [],
      tagSuffix: "",
      // replace: [],
      ignore: [
        ".mce-content-body",
        ":root",
        "body.edit",
        "body.edit.cgb-toolbar-open",
      ],
    }),
  ],
};
