import {
  HtmlTagDescriptor,
  IndexHtmlTransform,
  Plugin,
  PluginOption,
  ResolvedConfig,
} from "vite";
import "dotenv/config";
import { JSDOM, ResourceLoader, VirtualConsole } from "jsdom";

const CANVAS_HOST = process.env.CANVAS_BLOCKS_BASE_DOMAINS?.split(",")[0];
if (!CANVAS_HOST)
  throw new Error("Missing CANVAS_BLOCKS_BASE_DOMAINS in .env file");
const page = `https://${CANVAS_HOST}/404.html`;

const response = await fetch(page).catch((error) => {
  console.error("Failed to fetch the page: ", page);
  console.error(error.cause);
  throw error;
});
console.log("Using this page for Canvas Styles: ", page);

class CustomResourceLoader extends ResourceLoader {
  fetch(url: string, options: any) {
    // Override the contents of this script to do something unusual.
    if (url.startsWith(process.env.CANVAS_BLOCKS_THEME_HOST || "\0")) {
      return Promise.resolve(Buffer.from("")) as ReturnType<
        ResourceLoader["fetch"]
      >;
    }

    return super.fetch(url, options);
  }
}

const resourceLoader = new CustomResourceLoader();

const body = response.text().then((res) => {
  const virtualConsole = new VirtualConsole();
  virtualConsole.sendTo(console, { omitJSDOMErrors: true });
  // https://stackoverflow.com/a/75949433
  virtualConsole.on("jsdomError", (err) => {
    if (err.message !== "Could not parse CSS stylesheet") {
      console.error(err);
    }
  });
  return new JSDOM(res, {
    resources: resourceLoader,
    pretendToBeVisual: true,
    virtualConsole,
  });
});

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
        if (config.command === "build" && config.mode !== "sandpit") return "";
        const realCanvasHTML = await body;
        const InstScript = Array.from(
          realCanvasHTML.window.document.querySelectorAll("script")
        ).find((script) => script.innerHTML.includes("INST = "));
        if (!InstScript) return "";
        return `${InstScript.innerHTML.replace(
          /(INST|ENV|BRANDABLE_CSS_HANDLEBARS_INDEX|REMOTES)/g,
          "window.$1"
        )}`;
      }
    },
    async transformIndexHtml() {
      if (config.command === "build" && config.mode !== "sandpit") return;
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
