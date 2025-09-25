import glob from "fast-glob";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { temporaryFile, temporaryWrite, temporaryWriteTask } from "tempy";
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import svg2ttf from "svg2ttf";
import ttf2woff from "ttf2woff";
import wawoff2 from "wawoff2";
import hash_sum from "hash-sum";
import { exec as callbackExec } from "child_process";
import cliProgress from "cli-progress";
import Cache from "async-disk-cache";
import dotenv from "dotenv";
import pLimit from "p-limit";
import { promisify } from "util";
import { fileURLToPath } from 'url';

const exec = promisify(callbackExec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * Represents a searchable icon.
 */
interface searchableIcons {
  /** The ID of the icon. */
  i: string;
  /** The name (title) of the icon. */
  n: string;
  /** The ligature of the icon. */
  l: string;
  /** The search terms of the icon. This includes tags and collections. */
  s: string[];
}

interface MetaFile {
  name?: string;
  visible?: boolean;
  icons: {
    id: string;
    ligature?: string;
    url: string;
    title: string;
    name: string;
    tags?: string[];
    term?: string;
    collections?: string[];
  }[];
}

const disableCache = process.env.CANVAS_BLOCKS_DISABLE_FONTCACHE === "true";

const cache = new Cache("vite-plugin-design-blocks-icons", {
  supportBuffer: true,
});

const fontOptions: SVGIcons2SVGFontStream.SvgIcons2FontOptions = {
  fontName: "design-blocks-icons",
  normalize: true,
  fontHeight: 1000,
};

/**
 * Represents a set of categories of icons.
 * This is the main class for the icon library.
 */
export class IconSet {
  importProgress = new cliProgress.SingleBar(
    {
      etaBuffer: 100,
      fps: 5,
      etaAsynchronousUpdate: true,
    },
    cliProgress.Presets.shades_classic
  );
  categories: IconCategory[] = [];
  constructor(
    public logger: {
      info: (log: string) => void;
      warn: (log: string) => void;
      error: (log: string) => void;
    } = console
  ) {}
  get iconSVGMap() {
    return this.categories.reduce((acc, category) => {
      return {
        ...acc,
        ...category.iconSVGMap,
      };
    }, {} as Record<string, string>);
  }
  get iconSearchList() {
    return this.visibleCategories.map((cat) => {
      return {
        name: cat.name,
        icons: cat.icons.map((icon) => {
          return {
            i: icon.id,
            n: icon.name,
            l: icon.ligature,
            s: [...(icon.tags || []), ...(icon.collections || [])],
          } as searchableIcons;
        }),
      };
    });
  }
  get visibleCategories() {
    return this.categories.filter((cat) => cat.icons.length > 0 && cat.visible);
  }
  importFolder(
    folder: string,
    {
      fromNodeModules = false,
      useSubfoldersAsCategories = false,
      categoryName = "default",
      visible = true,
      prefix = "",
    }
  ) {
    const nodeModuleDir = path.join(
      __dirname,
      "../../../../",
      "./node_modules/"
    );
    const found = glob.sync(`${folder}/**/*.svg`, {
      cwd: fromNodeModules ? nodeModuleDir : __dirname,
      absolute: true,
    });
    found.forEach((foundIcon) => {
      const [_, subfolder, name] =
        foundIcon.match(/([^/]+)\/([^/]+)\.svg$/) || [];
      const source = fs.readFileSync(foundIcon);
      const icon = new Icon(name, source);
      let catName = prefix + categoryName;
      if (useSubfoldersAsCategories) {
        catName = prefix + subfolder;
      }
      const category = this.categories.find((cat) => cat.name === catName);
      if (category) {
        category.icons.push(icon);
      } else {
        const newCategory = new IconCategory(catName, [icon], visible);
        this.categories.push(newCategory);
      }
    });
  }
  importRichFolder(
    folder: string,
    {
      /** If true, will load the icons from the node_modules folder. Does not affect metaPath */
      fromNodeModules = false,
      /** If specified, will load the meta.json file from this path. */
      metaPath = "",
    } = {}
  ) {
    const cwd = fromNodeModules
      ? path.join(__dirname, "../../../../", "./node_modules/")
      : __dirname;
    let foundMeta: string[] = [];
    if (metaPath) {
      foundMeta = [metaPath];
    } else {
      foundMeta = glob.sync(`${folder}/**/meta.json`, {
        cwd,
        absolute: true,
      });
    }
    // Read meta.json files
    const categories = foundMeta.map((foundPath) => {
      const source = fs.readFileSync(foundPath);
      const folderName = metaPath
        ? ""
        : path.dirname(foundPath).split(path.sep).pop() || "Default";
      const parsed = JSON.parse(source.toString()) as MetaFile;
      // Read SVG files
      const icons = parsed.icons.map((icon) => {
        const source = fs.readFileSync(
          path.join(
            metaPath ? path.resolve(cwd, folder) : path.dirname(foundPath),
            icon.url
          )
        );
        return new Icon(icon.title || icon.name, source, icon);
      });
      return new IconCategory(
        parsed.name || folderName || "default",
        icons,
        parsed.visible
      );
    });
    this.categories.push(...categories);
  }
  async createIconFont() {
    // const sortedIcons = this.categories
    //   .flatMap((cat) => cat.icons)
    //   .sort((a, b) => a.name.localeCompare(b.name));
    // Get hash for caching
    const hash_input = hash_sum([this.iconSVGMap, fontOptions]);
    // Check cache
    const cached = await cache.get("icon");
    let cachedResult = cached.isCached
      ? (JSON.parse(cached.value || "undefined") as
          | {
              hash?: string;
              ttf?: string;
              woff2?: string;
              woff?: string;
              svg?: string;
            }
          | undefined)
      : undefined;
    let cachedHash = cachedResult?.hash?.toString() || "";
    if (
      !disableCache &&
      cached.isCached &&
      cachedHash === hash_input.toString() &&
      cachedResult?.ttf &&
      cachedResult?.woff2 &&
      cachedResult?.woff &&
      cachedResult?.svg
    ) {
      this.logger.info("Using cached SVG font");
      return {
        svg: Buffer.from(cachedResult.svg, "base64"),
        ttf: Buffer.from(cachedResult.ttf, "base64"),
        woff: Buffer.from(cachedResult.woff, "base64"),
        woff2: Buffer.from(cachedResult.woff2, "base64"),
      };
    }

    if (cached.isCached) {
      this.logger.info("Regenerating SVG font. This may take a while.");
      if (disableCache && cachedHash === hash_input.toString()) {
        this.logger.info(
          "Cache is disabled, but a cached version was found. Skipping cache."
        );
      } else {
        this.logger.info(
          `Hash comparison: ${cachedHash} (cached) !== ${hash_input} (current)`
        );
      }
    } else {
      this.logger.info("Generating SVG font. This may take a while.");
    }
    // First, check for ligature collisions
    // This is not optimal performance, but it's the easiest way to check for collisions
    const ligs = Object.keys(this.iconSVGMap);
    const hasCollision = ligs.filter((name, idx) =>
      ligs.some((name2, idx2) => idx !== idx2 && name2.startsWith(name))
    );
    if (hasCollision.length > 0) {
      this.logger.error("Found ligature collision:" + hasCollision.join(", "));
      throw new Error("Found ligature collision");
    }
    this.logger.info("Converting SVGs to minified SVGs");
    this.importProgress.start(Object.keys(this.iconSVGMap).length, 0);
    const limit = pLimit(13);
    const paths = await Promise.all(
      Object.entries(this.iconSVGMap).map(([name, svg]) =>
        limit(
          async ([name, svg]) => {
            const filepath = await temporaryWrite(svg);
            // Run picosvg on this file
            if (svg.includes("stroke-width:")) {
              this.logger.info("Found stroke-width in" + name);
            }
            await exec(
              `picosvg ${filepath} --output_file ${filepath} --clip_to_viewbox true --drop_unsupported true`
            ).catch((err) => {
              this.logger.warn(
                `Error running picosvg on ${name
                  .split(".")
                  .join("/")}: ${err.stderr
                  .split("\n")
                  .filter((l: string) => l.length > 1)
                  .pop()}`
              );
            });
            this.importProgress.increment();
            return [name, fs.createReadStream(filepath)];
          },
          [name, svg]
        )
      )
    );
    this.importProgress.stop();
    this.logger.info("Creating combined SVG font");
    this.importProgress.start(paths.length, 0);
    // Run svgicons2svgfont
    const _this = this;
    const fontPromise = new Promise<string>((resolve, reject) => {
      const fontStream = new SVGIcons2SVGFontStream(fontOptions);
      // Was "../dist/design-blocks-icons.svg"
      const tempSvgFile = temporaryFile();
      fontStream
        .pipe(fs.createWriteStream(tempSvgFile))
        .on("finish", function () {
          _this.logger.info("Finished writing SVG font");
          resolve(tempSvgFile);
        })
        .on("error", function (err) {
          _this.logger.warn("Error writing SVG font: " + err);
          reject(err);
        });

      paths.forEach(([name, stream], index) => {
        if (!name.toString()) return;
        // @ts-ignore
        stream.metadata = {
          unicode: [
            String.fromCharCode("\uE000".charCodeAt(0) + index),
            name.toString(),
          ],
          name: name.toString(),
        };
        fontStream.write(stream);
        this.importProgress.increment();
      });
      fontStream.end();
    });
    this.importProgress.stop();
    const outputFile = await fontPromise;
    // Convert
    this.logger.info("Converting SVG font to TTF, WOFF, and WOFF2");
    const ttf = svg2ttf(fs.readFileSync(outputFile).toString(), {});
    const woff = ttf2woff(ttf.buffer, {});
    const woff2 = await wawoff2.compress(Buffer.from(ttf.buffer));
    // // Get and return hash
    // const hash_output = hash_sum(ttf.buffer);
    this.logger.info("Finished generating font");
    // Cache result
    await cache.set(
      "icon",
      JSON.stringify({
        hash: hash_input,
        ttf: Buffer.from(ttf.buffer).toString("base64"),
        woff: woff.toString("base64"),
        woff2: Buffer.from(woff2).toString("base64"),
        svg: fs.readFileSync(outputFile).toString("base64"),
      })
    );
    return {
      ttf: Buffer.from(ttf.buffer),
      woff: woff,
      woff2: Buffer.from(woff2),
      svg: fs.readFileSync(outputFile),
    };
  }
}

export class IconCategory {
  constructor(
    public name: string,
    public icons: Icon[] = [],
    public visible: boolean = true
  ) {}
  get iconSVGMap() {
    return this.icons.reduce((acc, icon) => {
      return {
        ...acc,
        [`${this.name}.${icon.ligature}`]: icon.svg,
      };
    }, {} as Record<string, string>);
  }
}

export class Icon {
  id: string;
  title: string | undefined;
  tags: string[] | undefined;
  term: string | undefined;
  collections: string[] | undefined;
  ligature: string | undefined;
  constructor(
    public name: string,
    public file: Buffer,
    meta: Partial<{
      ligature: string;
      id: string;
      title: string;
      tags: string[];
      term: string;
      collections: string[];
      url: string;
    }> = {}
  ) {
    this.id = meta.id || nanoid(5);
    this.title = meta.title;
    this.tags = meta.tags;
    this.term = meta.term;
    this.collections = meta.collections;
    this.ligature =
      meta.ligature || meta.url?.split("/").pop()?.split(".")[0] || this.name;
  }
  get base64() {
    return `data:image/svg+xml;base64,${this.file.toString("base64")}`;
  }
  get svg() {
    return this.file.toString();
  }
}
