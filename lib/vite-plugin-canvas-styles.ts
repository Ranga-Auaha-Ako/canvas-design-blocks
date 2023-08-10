import {
  HtmlTagDescriptor,
  IndexHtmlTransform,
  Plugin,
  PluginOption,
  ResolvedConfig,
} from "vite";
import "dotenv/config";
import { JSDOM } from "jsdom";

const CANVAS_HOST = process.env.CANVAS_BLOCKS_BASE_DOMAINS?.split(",")[0];
if (!CANVAS_HOST)
  throw new Error("Missing CANVAS_BLOCKS_BASE_DOMAINS in .env file");
const page = `https://${CANVAS_HOST}/404.html`;
const response = await fetch(page);
const body = response.text().then(
  (res) =>
    new JSDOM(res, {
      resources: "usable",
      pretendToBeVisual: true,
    })
);

export default function vitePluginCanvasStyles(): PluginOption {
  let config: ResolvedConfig;
  const virtualModuleId = "virtual:inst-env";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
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
        if (config.command === "build") return "";
        const realCanvasHTML = await body;
        const InstScript = Array.from(
          realCanvasHTML.window.document.querySelectorAll("script")
        ).find((script) => script.innerHTML.includes("INST = "));
        if (!InstScript) return "";
        return `${InstScript.innerHTML.replace(
          /(INST|ENV|BRANDABLE_CSS_HANDLEBARS_INDEX)/g,
          "window.$1"
        )}`;
      }
    },
    async transformIndexHtml() {
      if (config.command === "build") return;
      const realCanvasHTML = await body;
      let newTags: HtmlTagDescriptor[] = [];
      Array.from(
        realCanvasHTML.window.document.querySelectorAll("style")
      ).forEach((style) => {
        newTags.push({
          tag: "style",
          children: style.innerHTML,
        });
      });

      Array.from(
        realCanvasHTML.window.document.querySelectorAll("link[rel=stylesheet]")
      ).forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;
        newTags.push({
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href,
          },
        });
      });

      newTags.push({
        tag: "style",
        children: "Test{color: red}",
      });
      return newTags;
    },
  };
}
