import glob from "fast-glob";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { temporaryFile, temporaryWrite, temporaryWriteTask } from "tempy";
import { PythonShell } from "python-shell";
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import svg2ttf from "svg2ttf";
import ttf2woff from "ttf2woff";
import wawoff2 from "wawoff2";
import hash_sum from "hash-sum";
import { exec, spawnSync } from "child_process";
import cliProgress from "cli-progress";
import Cache from "async-disk-cache";
import dotenv from "dotenv";

dotenv.config();

/**
 * Represents a searchable icon.
 */
interface searchableIcons {
  /** The name of the icon. */
  n: string;
  /** The filename of the icon. */
  f: string;
  /** The search terms of the icon. This includes tags and collections. */
  s: string[];
}

const disableCache = process.env.CANVAS_BLOCKS_DISABLE_FONTCACHE === "true";

const cache = new Cache("vite-plugin-design-blocks-icons", {
  supportBuffer: true,
});

const fontOptions = {
  fontName: "design-blocks-icons",
  normalize: true,
  fontHeight: 1000,
  fixedWidth: true,
};

export class IconSet {
  importProgress = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  categories: IconCategory[] = [new IconCategory("default")];
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
    return this.categories.map((cat) => {
      return {
        name: cat.name,
        icons: cat.icons.map((icon) => {
          return {
            n: icon.name,
            f: icon.filename,
            s: [...(icon.tags || []), ...(icon.collections || [])],
          } as searchableIcons;
        }),
      };
    });
  }
  importFolder(
    folder: string,
    {
      fromNodeModules = false,
      useSubfoldersAsCategories = false,
      categoryName = "default",
    }
  ) {
    const nodeModuleDir = path.join(
      __dirname,
      "../../../../",
      "./node_modules/"
    );
    const found = glob.sync(`${folder}/**/*.svg`, {
      cwd: fromNodeModules ? nodeModuleDir : undefined,
      absolute: true,
    });
    found.forEach((foundIcon) => {
      const [_, subfolder, name] =
        foundIcon.match(/([^/]+)\/([^/]+)\.svg$/) || [];
      const source = fs.readFileSync(foundIcon);
      const icon = new Icon(name, source);
      let catName = categoryName;
      if (useSubfoldersAsCategories) {
        catName = subfolder;
      }
      const category = this.categories.find((cat) => cat.name === catName);
      if (category) {
        category.icons.push(icon);
      } else {
        const newCategory = new IconCategory(catName);
        newCategory.icons.push(icon);
        this.categories.push(newCategory);
      }
    });
  }
  importRichFolder(
    folder: string,
    { fromNodeModules = false } = { fromNodeModules: false }
  ) {
    const cwd = fromNodeModules
      ? path.join(__dirname, "../../../../", "./node_modules/")
      : __dirname;
    const foundMeta = glob.sync(`${folder}/**/meta.json`, {
      cwd,
      absolute: true,
    });
    // Read meta.json files
    const categories = foundMeta.map((foundMeta) => {
      const source = fs.readFileSync(foundMeta);
      const folderName =
        path.dirname(foundMeta).split(path.sep).pop() || "Default";
      const parsed = JSON.parse(source.toString()) as {
        name?: string;
        icons: {
          id: string;
          url: string;
          title: string;
          name: string;
          tags?: string[];
          term?: string;
          collections?: string[];
        }[];
      };
      // Read SVG files
      const icons = parsed.icons.map((icon) => {
        const source = fs.readFileSync(
          path.join(path.dirname(foundMeta), icon.url)
        );
        return new Icon(icon.title || icon.name, source, icon);
      });
      return new IconCategory(parsed.name || folderName || "default", icons);
    });
    this.categories = categories;
  }
  async createIconFont() {
    // const sortedIcons = this.categories
    //   .flatMap((cat) => cat.icons)
    //   .sort((a, b) => a.name.localeCompare(b.name));
    // Get hash for caching
    const hash_input = hash_sum([this.iconSVGMap, fontOptions]);
    // Check cache
    const cached = await cache.get("icon");
    let cachedResult = JSON.parse(cached.value || "undefined") as
      | { hash?: string; ttf?: string; woff2?: string; woff?: string }
      | undefined;
    let cachedHash = cachedResult?.hash?.toString() || "";
    if (
      !disableCache &&
      cached.isCached &&
      cachedHash === hash_input.toString() &&
      cachedResult?.ttf &&
      cachedResult?.woff2 &&
      cachedResult?.woff
    ) {
      this.logger.info("Using cached SVG font");
      return {
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
    this.logger.info("Converting SVGs to minified SVGs");
    this.importProgress.start(Object.keys(this.iconSVGMap).length, 0);
    const paths = await Promise.all(
      Object.entries(this.iconSVGMap).map(async ([name, svg]) => {
        const filepath = await temporaryWrite(svg);
        // Run picosvg on this file
        if (svg.includes("stroke-width:")) {
          this.logger.info("Found stroke-width in", name);
        }
        const res = spawnSync("picosvg", [
          filepath,
          "--output_file",
          filepath,
          "--clip_to_viewbox",
          "true",
          "--drop_unsupported",
          "true",
        ]);
        // await PythonShell.run("picosvg", {
        //   args: [filepath],
        // });
        this.importProgress.increment();
        return [name, fs.createReadStream(filepath)];
      })
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
          _this.logger.warn("Error writing SVG font", err);
          reject(err);
        });

      paths.forEach(([name, stream]) => {
        if (!name.toString()) return;
        // @ts-ignore
        stream.metadata = { unicode: [name.toString()], name: name.toString() };
        fontStream.write(stream);
        this.importProgress.increment();
      });
      fontStream.end();
    });
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
      })
    );
    return {
      ttf: Buffer.from(ttf.buffer),
      woff: woff,
      woff2: Buffer.from(woff2),
    };
  }
}

export class IconCategory {
  constructor(public name: string, public icons: Icon[] = []) {}
  get iconSVGMap() {
    return this.icons.reduce((acc, icon) => {
      return {
        ...acc,
        [`${this.name}.${icon.filename}`]: icon.svg,
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
  filename: string | undefined;
  constructor(
    public name: string,
    public file: Buffer,
    meta: Partial<{
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
    this.filename = meta.url?.split("/").pop()?.split(".")[0];
  }
  get base64() {
    return `data:image/svg+xml;base64,${this.file.toString("base64")}`;
  }
  get svg() {
    return this.file.toString();
  }
}
