import { glob } from "fast-glob";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { temporaryWrite, temporaryWriteTask } from "tempy";
import { PythonShell } from "python-shell";
import SVGIcons2SVGFontStream from "svgicons2svgfont";
import svg2ttf from "svg2ttf";
class IconSet {
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
    const found = glob.sync(`${folder}/**/*.svg`, {
      cwd: fromNodeModules
        ? path.join(__dirname, "../../../../", "./node_modules/")
        : undefined,
    });
    found.forEach((foundIcon) => {
      const [_, subfolder, name] =
        foundIcon.match(/([^/]+)\/([^/]+)\.svg$/) || [];
      const source = fs.readFileSync(
        path.join(__dirname, "../", "./node_modules/", foundIcon)
      );
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
  importRichFolder(folder: string, { fromNodeModules = false }) {
    const cwd = fromNodeModules
      ? path.join(__dirname, "../../../../", "./node_modules/")
      : undefined;
    const foundMeta = glob.sync(`${folder}/**/meta.json`, {
      cwd,
      absolute: true,
    });
    // Read meta.json files
    const categories = foundMeta.map((foundMeta) => {
      const source = fs.readFileSync(foundMeta);
      const parsed = JSON.parse(source.toString()) as {
        name?: string;
        icons: {
          id: string;
          url: string;
          name: string;
          title?: string;
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
        return new Icon(icon.name, source, icon);
      });
      return new IconCategory(parsed.name || "default", icons);
    });
    this.categories = categories;
  }
  async createIconFont() {
    const paths = await Promise.all(
      Object.entries(this.iconSVGMap).map(async ([name, svg]) => {
        console.log(name, svg);
        const filepath = await temporaryWrite(svg);
        // Run picosvg on this file
        await PythonShell.run("picosvg", {
          args: [filepath],
        });
        return [name, fs.createReadStream(filepath)];
      })
    );
    // Run svgicons2svgfont
    const fontPromise = new Promise<string>((resolve, reject) => {
      const fontStream = new SVGIcons2SVGFontStream({
        fontName: "design-blocks-icons",
      });
      fontStream
        .pipe(fs.createWriteStream("../dist/design-blocks-icons.svg"))
        .on("finish", function () {
          resolve("../dist/design-blocks-icons.svg");
        })
        .on("error", function (err) {
          reject(err);
        });

      paths.forEach(([name, stream]) => {
        fontStream.write({
          name,
          stream,
        });
      });
      fontStream.end();
    });
    const outputFile = await fontPromise;
    // Convert
    const ttf = svg2ttf(fs.readFileSync(outputFile).toString(), {});
    // Write
    fs.writeFileSync(
      "../dist/design-blocks-icons.ttf",
      Buffer.from(ttf.buffer)
    );
  }
}

class IconCategory {
  constructor(public name: string, public icons: Icon[] = []) {}
  get iconSVGMap() {
    return this.icons.reduce((acc, icon) => {
      return {
        ...acc,
        [`${this.name}.${icon.name}`]: icon.svg,
      };
    }, {} as Record<string, string>);
  }
}

class Icon {
  id: string;
  title: string | undefined;
  tags: string[] | undefined;
  term: string | undefined;
  collections: string[] | undefined;
  constructor(
    public name: string,
    public file: Buffer,
    meta: Partial<{
      id: string;
      title: string;
      tags: string[];
      term: string;
      collections: string[];
    }> = {}
  ) {
    this.id = meta.id || nanoid(5);
    this.title = meta.title;
    this.tags = meta.tags;
    this.term = meta.term;
    this.collections = meta.collections;
  }
  get base64() {
    return `data:image/svg+xml;base64,${this.file.toString("base64")}`;
  }
  get svg() {
    return this.file.toString();
  }
}
