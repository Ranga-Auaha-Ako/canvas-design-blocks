import MagicString from "magic-string";
import { PluginOption, ResolvedConfig } from "vite";
import { IconSet } from "./icons";
import fs from "fs";

export default function vitePluginIcons(): PluginOption {
  const iconset = new IconSet();
  let buffer: ReturnType<typeof iconset.createIconFont> | undefined;
  const getIconBuffer = async () => {
    if (!buffer) {
      iconset.importFolder("@instructure/ui-icons/svg", {
        fromNodeModules: true,
        useSubfoldersAsCategories: true,
      });
      iconset.importRichFolder("../assets/custom");
      buffer = iconset.createIconFont();
    }
    return buffer;
  };
  const virtualModuleId = "virtual:blocks-icons";
  const virtualStylesModuleId = "virtual:blocks-icons.css";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  const resolvedVirtualStylesModuleId = "\0" + virtualStylesModuleId;
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
      if (id === virtualStylesModuleId) {
        return resolvedVirtualStylesModuleId;
      }
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `export const meta = ${JSON.stringify(iconset.iconSearchList)};`;
      }
      if (id === resolvedVirtualStylesModuleId) {
        let assets = {
          ttf: "/@devicons/iconFont.ttf",
          woff: "/@devicons/iconFont.woff",
          woff2: "/@devicons/iconFont.woff2",
        };
        if (config.command === "build") {
          iconset.logger = this;
          const b = await getIconBuffer();
          this.emitFile({
            type: "asset",
            needsCodeReference: false,
            name: `iconFont.ttf`,
            fileName: "f/iconFont.ttf",
            source: b.ttf,
          });
          this.emitFile({
            type: "asset",
            needsCodeReference: false,
            name: `iconFont.woff`,
            fileName: "f/iconFont.woff",
            source: b.woff,
          });
          this.emitFile({
            type: "asset",
            needsCodeReference: false,
            name: `iconFont.woff2`,
            fileName: "f/iconFont.woff2",
            source: b.woff2,
          });
          assets = {
            ttf: "/f/iconFont.ttf",
            woff: "/f/iconFont.woff",
            woff2: "/f/iconFont.woff2",
          };
        }
        return `@font-face { font-family: 'BlocksIcons';
        src:  url('${assets.woff2}') format('woff2'), 
        url('${assets.woff}') format('woff'),
        url('${assets.ttf}') format('truetype');}`;
      }
    },
    async configureServer(server) {
      // Serve the icon font in the dev server
      const b = await getIconBuffer();
      server.middlewares.use((req, res, next) => {
        switch (req.url) {
          case "/@devicons/iconFont.woff":
            res.setHeader("Content-Type", "font/woff");
            res.end(b.woff);
            break;
          case "/@devicons/iconFont.woff2":
            res.setHeader("Content-Type", "font/woff2");
            res.end(b.woff2);
            break;
          case "/@devicons/iconFont.ttf":
            res.setHeader("Content-Type", "font/ttf");
            res.end(b.ttf);
            break;
          default:
            next();
        }
      });
    },
  };
}
