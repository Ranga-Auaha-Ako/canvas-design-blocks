import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";
const { version } = packageJson;
import "dotenv/config";

// Load basedomains from CANVAS_BLOCKS_BASE_DOMAINS environment variable
// @ts-ignore
const BaseDomains: string[] = process.env.CANVAS_BLOCKS_BASE_DOMAINS?.split(
  ","
) ?? ["canvas.auckland.ac.nz"];

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = "0"] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, "")
  // split into version parts
  .split(/[.-]/);

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name:
    env.mode === "beta"
      ? "[INTERNAL] Canvas Design Blocks"
      : env.mode === "testing"
      ? "[CANVAS THEME] Canvas Design Blocks"
      : "Canvas Design Blocks",
  homepage_url: "https://teachwell.auckland.ac.nz/",
  host_permissions: BaseDomains.map((d) => `*://${d}/*`),
  permissions: [],
  short_name: "Design Blocks",
  description:
    "Quickly create and edit pages, creating grids and other elements without using the HTML editor.",
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}.${label}`,
  // semver is OK in "version_name"
  version_name: version,
  action: {
    default_icon:
      env.mode === "beta" || env.mode === "testing"
        ? {
            "16": "icon/beta/logo_icon_16.png",
            "24": "icon/beta/logo_icon_24.png",
            "32": "icon/beta/logo_icon_32.png",
          }
        : {
            "16": "icon/logo_icon_16.png",
            "24": "icon/logo_icon_24.png",
            "32": "icon/logo_icon_32.png",
          },
    default_title: "Canvas Design Blocks",
  },
  icons:
    env.mode === "beta" || env.mode === "testing"
      ? {
          "16": "icon/beta/logo_icon_16.png",
          "32": "icon/beta/logo_icon_32.png",
          "48": "icon/beta/logo_icon_48.png",
          "128": "icon/beta/logo_icon_128.png",
        }
      : {
          "16": "icon/logo_icon_16.png",
          "32": "icon/logo_icon_32.png",
          "48": "icon/logo_icon_48.png",
          "128": "icon/logo_icon_128.png",
        },

  author: "raa@auckland.ac.nz",
  web_accessible_resources: [
    {
      matches: BaseDomains.map((d) => `*://${d}/*`),
      resources: ["src/main.ts"],
    },
  ],

  content_scripts: [
    {
      matches: BaseDomains.map((d) => `*://${d}/*`),
      js: ["src/extension-loader.ts"],
      css: [],
    },
  ],
}));
