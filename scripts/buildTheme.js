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
  for (const mode of ["desktop", "mobile"]) {
    const blocksCss = `@import url('${
      process.env.CANVAS_BLOCKS_THEME_HOST
    }canvas-blocks${mode === "mobile" ? "-mobile" : ""}.css');`;
    const blocksJs = fs.readFileSync(
      path.resolve(
        __dirname,
        `../dist/theme-loader${mode === "mobile" ? "-mobile" : ""}.umd.cjs`
      )
    );
    let themeCss = "";
    let themeJs = "";
    try {
      themeCss = fs
        .readFileSync(path.resolve(__dirname, "../themeStyles.css"))
        .toString();
      themeJs = fs
        .readFileSync(path.resolve(__dirname, "../themeScripts.js"))
        .toString();
    } catch (e) {}

    // const css = `/* Design Blocks Start */
    const css = `${blocksCss.toString()}
/* Design Blocks End */

${themeCss.toString()}`;

    const js = `// Design Blocks Start
${blocksJs.toString()}
// Design Blocks End

${themeJs.toString()}`;

    fs.writeFileSync(
      path.resolve(
        __dirname,
        `../dist/theme${mode === "mobile" ? "-mobile" : ""}.css`
      ),
      css
    );
    fs.writeFileSync(
      path.resolve(
        __dirname,
        `../dist/blocks${mode === "mobile" ? "-mobile" : ""}.css`
      ),
      blocksCss.toString()
    );
    fs.writeFileSync(
      path.resolve(
        __dirname,
        `../dist/theme${mode === "mobile" ? "-mobile" : ""}.js`
      ),
      js
    );
  }
  console.log("✓ Theme files merged.");
  console.log("dist/theme.css");
  console.log("dist/theme-mobile.css");
  console.log(
    "dist/blocks.css - used for manual inclusion of CSS in other theme files"
  );
  console.log(
    "dist/blocks-mobile.css - used for manual inclusion of CSS in other theme files"
  );
  console.log("dist/theme.js");
  console.log("dist/theme-mobile.js");
} catch (e) {
  console.log("No theme files to merge.");
}
