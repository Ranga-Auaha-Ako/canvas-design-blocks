import MagicString from "magic-string";
import { PluginOption, ResolvedConfig } from "vite";
import { IconSet } from "./icons";
import fs from "fs";
import path from "path";

export default function vitePluginIcons(): PluginOption {
  const iconset = new IconSet();
  let buffer: ReturnType<typeof iconset.createIconFont> | undefined;
  const getIconBuffer = async () => {
    if (!buffer) {
      iconset.importRichFolder("@instructure/ui-icons/svg/Line", {
        fromNodeModules: true,
        metaPath: path.resolve(__dirname, "../assets/instructure/meta.json"),
      });
      iconset.importRichFolder("../assets/custom");
      buffer = iconset.createIconFont();
    }
    return buffer;
  };
  const virtualModuleId = "virtual:blocks-icons";
  const virtualStylesModuleId = "virtual:blocks-icons.css";
  const virtualStylesInlineModuleId = "virtual:blocks-icons-editor-styles";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  const resolvedVirtualStylesModuleId = "\0" + virtualStylesModuleId;
  const resolvedVirtualStylesInlineModuleId =
    "\0" + virtualStylesInlineModuleId;
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
      if (id === virtualStylesInlineModuleId) {
        return resolvedVirtualStylesInlineModuleId;
      }
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `export default ${JSON.stringify(iconset.iconSearchList)};`;
      }
      if (
        id === resolvedVirtualStylesModuleId ||
        id === resolvedVirtualStylesInlineModuleId
      ) {
        const base = config.server?.origin + config.base;
        let assets = {
          ttf: base + "@devicons/iconFont.ttf",
          woff: base + "@devicons/iconFont.woff",
          woff2: base + "@devicons/iconFont.woff2",
        };
        if (config.command === "build") {
          iconset.logger = this;
          const b = await getIconBuffer();
          // This relies on Vite to manage the asset, but __VITE_ASSET__ is not
          // documented and could change at any time.
          // Issue: https://github.com/vitejs/vite/issues/13459
          this.emitFile({
            type: "asset",
            needsCodeReference: false,
            name: `iconFont.svg`,
            source: b.svg,
          });
          assets = {
            ttf: `__VITE_ASSET__${this.emitFile({
              type: "asset",
              needsCodeReference: false,
              name: `iconFont.ttf`,
              // fileName: "f/iconFont.ttf",
              source: b.ttf,
            })}__`,
            woff: `__VITE_ASSET__${this.emitFile({
              type: "asset",
              needsCodeReference: false,
              name: `iconFont.woff`,
              // fileName: "f/iconFont.woff",
              source: b.woff,
            })}__`,
            woff2: `__VITE_ASSET__${this.emitFile({
              type: "asset",
              needsCodeReference: false,
              name: `iconFont.woff2`,
              // fileName: "f/iconFont.woff2",
              source: b.woff2,
            })}__`,
          };
        }
        const fontFaceString = `@font-face { font-family: 'BlocksIcons'; src:  url('${assets.woff2}') format('woff2'), url('${assets.woff}') format('woff'), url('${assets.ttf}') format('truetype'); font-display: block;}`;
        if (id === resolvedVirtualStylesModuleId) {
          return fontFaceString;
        } else {
          return `export default "${fontFaceString}";`;
        }
      }
    },
    async configureServer(server) {
      // Serve the icon font in the dev server
      const b = await getIconBuffer();
      server.middlewares.use((req, res, next) => {
        switch (req.url) {
          case "/@devicons/iconFont.woff":
            res.setHeader("Content-Type", "font/woff");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(b.woff);
            break;
          case "/@devicons/iconFont.woff2":
            res.setHeader("Content-Type", "font/woff2");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(b.woff2);
            break;
          case "/@devicons/iconFont.ttf":
            res.setHeader("Content-Type", "font/ttf");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(b.ttf);
            break;
          default:
            next();
        }
      });
    },
  };
}
