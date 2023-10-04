import glob from "fast-glob";
import path from "path";
import type { PluginOption, ResolvedConfig, UserConfig } from "vite";
import fs from "fs";
import "dotenv/config";
import { nanoid } from "nanoid";
import MagicString from "magic-string";

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
    renderChunk(code, chunk, opts) {
      const s = new MagicString(code);
      s.prepend(`const __HOST__="${process.env.CANVAS_BLOCKS_THEME_HOST}";\n`);
      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      };
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
          if (
            config.command == "build" &&
            !config.mode?.includes("extension")
          ) {
            const _this = this;
            return {
              ...acc,
              [`${type}.${name}`]: `import.meta.ROLLUP_FILE_URL_${_this.emitFile(
                {
                  type: "asset",
                  name: `ic/${nanoid(5)}.svg`,
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
      if (config.command == "serve" || config.mode.includes("extension"))
        return null;
      // return `new URL('${fileName}', "${process.env.CANVAS_BLOCKS_THEME_HOST}").href`;
      return `
        new URL("${fileName}", __HOST__).href
      `;
    },
  };
}
