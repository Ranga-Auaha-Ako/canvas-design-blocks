import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

try {
  const blocksCss = fs.readFileSync(
    path.resolve(__dirname, "../dist/canvas-blocks.css")
  );
  const blocksJs = fs.readFileSync(
    path.resolve(__dirname, "../dist/canvas-blocks.min.js")
  );
  const themeCss = fs.readFileSync(
    path.resolve(__dirname, "../themeStyles.css")
  );
  const themeJs = fs.readFileSync(
    path.resolve(__dirname, "../themeScripts.js")
  );

  const css = `/* Design Block Start */
${blocksCss.toString()}
/* Design Block End */

${themeCss.toString()}`;

  const js = `// Design Block Start
${blocksJs.toString()}
// Design Block End

${themeJs.toString()}`;

  fs.writeFileSync(path.resolve(__dirname, "../dist/theme.css"), css);
  fs.writeFileSync(path.resolve(__dirname, "../dist/theme.js"), js);
} catch (e) {
  console.log("No theme files to merge.");
}
