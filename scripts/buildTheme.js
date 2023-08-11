import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import "dotenv/config";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

try {
  // const blocksCss = fs.readFileSync(
  //   path.resolve(__dirname, "../dist/canvas-blocks.css")
  // );
  const blocksCss = `@import url('${process.env.CANVAS_BLOCKS_THEME_HOST}canvas-blocks.css');`;
  const blocksJs = fs.readFileSync(
    path.resolve(__dirname, "../dist/theme-loader.umd.cjs")
  );
  const themeCss = fs.readFileSync(
    path.resolve(__dirname, "../themeStyles.css")
  );
  const themeJs = fs.readFileSync(
    path.resolve(__dirname, "../themeScripts.js")
  );

  // const css = `/* Design Blocks Start */
  const css = `${blocksCss.toString()}
/* Design Blocks End */

${themeCss.toString()}`;

  const js = `// Design Blocks Start
${blocksJs.toString()}
// Design Blocks End

${themeJs.toString()}`;

  fs.writeFileSync(path.resolve(__dirname, "../dist/theme.css"), css);
  fs.writeFileSync(
    path.resolve(__dirname, "../dist/blocks.css"),
    blocksCss.toString()
  );
  fs.writeFileSync(path.resolve(__dirname, "../dist/theme.js"), js);
  console.log("✓ Theme files merged.");
  console.log("dist/theme.css");
  console.log(
    "dist/blocks.css - used for manual inclusion of CSS in other theme files"
  );
  console.log("dist/theme.js");
} catch (e) {
  console.log("No theme files to merge.");
}
