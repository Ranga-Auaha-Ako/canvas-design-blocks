import { IconSet } from "./vite/icons";
import path from "path";
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// This is useful in docker situations where we want to have a cached copy of the iconset between builds

export const iconset = new IconSet();
iconset.importRichFolder("@instructure/ui-icons/svg/Line", {
  fromNodeModules: true,
  metaPath: path.resolve(__dirname, "./assets/instructure/meta.json"),
});
iconset.importRichFolder("../assets/custom");
iconset.importFolder("../assets/internal", {
  categoryName: "Internal",
  visible: false,
});
iconset.createIconFont();
