import * as instructureIcons from "@instructure/ui-icons/lib/font/index.js";
// import path from "node:path";
// import { fileURLToPath } from "url";

// import fs from "node:fs";

export interface IconFile {
  id: string;
  url?: string;
  title?: string;
  width: number;
  height: number;
  tnp_id: string;
  tags?: string[];
  term?: string;
  collections?: string[];
}

/**
 * BuiltinIcon is a tuple of [className, codepoint]
 * - `className` is the class name of the icon
 * - `codepoint` is the unicode codepoint of the icon
 */
export type BuiltinIcon = [string, string];

export interface Category<T = IconFile | BuiltinIcon> {
  name: string;
  icons: T[];
}

export default async () => {
  const builtinList = Object.entries(instructureIcons).map(([name, icon]) => ({
    name: icon.glyphName,
    variant: icon.variant,
    variantClass: icon.classes?.find((c) => c !== icon.className),
    cssFile: icon.cssFile,
    codepoint: icon.codepoint,
    className: icon.className,
    classes: icon.classes,
    deprecated: icon.deprecated,
  }));

  const builtinIcons = builtinList.reduce((acc, icon) => {
    if (icon.deprecated) return acc;
    const { variant, className } = icon;
    const category = acc.find((c) => c.name === variant);
    if (category) {
      category.icons.push([className, icon.codepoint]);
    } else if (variant) {
      acc.push({
        name: variant,
        icons: [className],
      });
    }
    return acc;
  }, [] as Category<BuiltinIcon>[]);
  return { data: builtinIcons };
};

// if (false) {
//   const __filename = fileURLToPath(import.meta.url);

//   const __dirname = path.dirname(__filename);
//   fs.writeFileSync(
//     path.join(__dirname, "builtin-icons.json"),
//     JSON.stringify(builtinIcons, null, 2)
//   );
// }
