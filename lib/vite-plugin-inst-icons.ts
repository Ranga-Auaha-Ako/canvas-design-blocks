import glob from "fast-glob";
import path from "path";
import type { PluginOption, ResolvedConfig, UserConfig } from "vite";
import fs from "fs";
import "dotenv/config";

const icons = glob.sync("@instructure/ui-icons/svg/**/*.svg", {
  cwd: path.join(__dirname, "../", "./node_modules/"),
});

export default function vitePluginInstIcons(): PluginOption {
  const virtualModuleId = "virtual:inst-icons";
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
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const iconMap = icons.reduce((acc, icon) => {
          const [_, type, name] = icon.match(/([^/]+)\/([^/]+)\.svg$/) || [];
          if (config.command == "build" && config.mode?.includes("theme")) {
            const _this = this;
            return {
              ...acc,
              [`${type}.${name}`]: `import.meta.ROLLUP_FILE_URL_${_this.emitFile(
                {
                  type: "asset",
                  name: path.basename(icon),
                  needsCodeReference: true,
                  source: fs.readFileSync(
                    path.join(__dirname, "../", "./node_modules/", icon)
                  ),
                }
              )}`,
            };
          } else {
            const iconContents = fs.readFileSync(
              path.join(__dirname, "../", "./node_modules/", icon)
            );
            return {
              ...acc,
              [`${type}.${name}`]: `"data:image/svg+xml;base64,${iconContents.toString(
                "base64"
              )}"`,
            };
          }
        }, {} as Record<string, string>);
        // Custom stringification to support variable props
        const objectString = `{${Object.entries(iconMap)
          .map(([n, u]) => {
            return `"${n.toString()}":${u}`;
          })
          .join(",")}}`;
        return `export const icons = ${objectString};`;
      }
    },
    resolveFileUrl({ fileName }) {
      if (config.command == "serve" || !config.mode.includes("theme"))
        return null;
      // return `new URL('${fileName}', "${process.env.CANVAS_BLOCKS_THEME_HOST}").href`;
      return `"${
        new URL(fileName, process.env.CANVAS_BLOCKS_THEME_HOST).href
      }"`;
    },
  };
}
