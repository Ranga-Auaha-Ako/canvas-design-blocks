import glob from "fast-glob";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { temporaryFile, temporaryWrite, temporaryWriteTask } from "tempy";
import { PythonShell } from "python-shell";
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import svg2ttf from "svg2ttf";
import hash_sum from "hash-sum";
import { exec, spawnSync } from "child_process";
import cliProgress from "cli-progress";
import Cache from "async-disk-cache";
import dotenv from "dotenv";

dotenv.config();

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
  constructor() {}
  get iconSVGMap() {
    return this.categories.reduce((acc, category) => {
      return {
        ...acc,
        ...category.iconSVGMap,
      };
    }, {} as Record<string, string>);
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
    if (
      !disableCache &&
      cached.isCached &&
      JSON.parse(cached.value).hash === hash_input
    ) {
      console.log("Using cached SVG font");
      fs.writeFileSync(
        "/Users/zmil425/Documents/Git/canvas-grid-builder/src/lib/icons/dist/design-blocks-icons.ttf",
        Buffer.from(JSON.parse(cached.value).result, "base64")
      );
      return cached.value;
    }

    if (cached.isCached) {
      console.log("Regenerating SVG font. This may take a while.");
    } else {
      console.log("Generating SVG font. This may take a while.");
    }
    console.log("Converting SVGs to minified SVGs");
    this.importProgress.start(Object.keys(this.iconSVGMap).length, 0);
    const paths = await Promise.all(
      Object.entries(this.iconSVGMap).map(async ([name, svg]) => {
        const filepath = await temporaryWrite(svg);
        // Run picosvg on this file
        if (svg.includes("stroke-width:")) {
          console.log("Found stroke-width in", name);
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
        if (name.includes("General.noun_Earth_619898")) {
          console.log(res.stdout.toString());
          console.log(res.stderr.toString());
          console.log(filepath);
        }
        // await PythonShell.run("picosvg", {
        //   args: [filepath],
        // });
        this.importProgress.increment();
        return [name, fs.createReadStream(filepath)];
      })
    );
    this.importProgress.stop();
    console.log("Creating combined SVG font");
    this.importProgress.start(paths.length, 0);
    // Run svgicons2svgfont
    const fontPromise = new Promise<string>((resolve, reject) => {
      const fontStream = new SVGIcons2SVGFontStream(fontOptions);
      // Was "../dist/design-blocks-icons.svg"
      const tempSvgFile = temporaryFile();
      fontStream
        .pipe(fs.createWriteStream(tempSvgFile))
        .on("finish", function () {
          resolve(tempSvgFile);
        })
        .on("error", function (err) {
          console.log("Error writing SVG font", err);
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

    fs.writeFileSync(
      "/Users/zmil425/Documents/Git/canvas-grid-builder/src/lib/icons/dist/design-blocks-icons.svg",
      Buffer.from(fs.readFileSync(outputFile))
    );
    // Convert
    console.log("Converting SVG font to TTF");
    const ttf = svg2ttf(fs.readFileSync(outputFile).toString(), {});
    // // Get and return hash
    // const hash_output = hash_sum(ttf.buffer);
    console.log("Finished generating font");
    // Cache result
    await cache.set(
      "icon",
      JSON.stringify({
        hash: hash_input,
        result: Buffer.from(ttf.buffer).toString("base64"),
      })
    );
    // Write
    fs.writeFileSync(
      "/Users/zmil425/Documents/Git/canvas-grid-builder/src/lib/icons/dist/design-blocks-icons.ttf",
      ttf.buffer
    );

    return ttf.buffer;
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
