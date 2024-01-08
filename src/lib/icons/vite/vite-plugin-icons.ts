import MagicString from "magic-string";
import { PluginOption, ResolvedConfig } from "vite";
import { IconSet } from "./icons";
import fs from "fs";

export default function vitePluginIcons(): PluginOption {
  const virtualModuleId = "virtual:blocks-icons";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-inst-icons",
    configResolved(resolvedConfig) {
      // store the resolved config
      config = resolvedConfig;
    },
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const iconset = new IconSet();
        iconset.importFolder("@instructure/ui-icons/svg", {
          fromNodeModules: true,
          useSubfoldersAsCategories: true,
        });
        iconset.importRichFolder("../assets/custom");
        const buffer = await iconset.createIconFont();
        if (config.command === "serve") {
          fs.writeFileSync(`./public/assets/iconFont.ttf`, buffer);
          return `export default "http://localhost:3000/assets/iconFont.ttf"`;
        } else {
          const asset = `import.meta.ROLLUP_FILE_URL_${this.emitFile({
            type: "asset",
            name: `iconFont.ttf`,
            needsCodeReference: false,
            source: buffer,
          })}`;
          console.log(asset);
          return `export default ${asset}`;
        }
      }
    },
  };
}
