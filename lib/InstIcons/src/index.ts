import * as instructureIcons from "@instructure/ui-icons";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

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

export type BuiltinIcon = string;

export interface Category<T = IconFile | BuiltinIcon> {
  name: string;
  icons: T[];
}

const builtinList = Object.entries(instructureIcons).map(([name, icon]) => ({
  name: icon.glyphName,
  variant: icon.variant,
}));

const builtinIcons = builtinList.reduce((acc, icon) => {
  const { variant, name } = icon;
  const category = acc.find((c) => c.name === variant);
  if (category) {
    category.icons.push(name);
  } else if (variant) {
    acc.push({
      name: variant,
      icons: [name],
    });
  }
  return acc;
}, [] as Category<BuiltinIcon>[]);

export default builtinIcons;

fs.writeFileSync(
  path.join(__dirname, "builtin-icons.json"),
  JSON.stringify(builtinIcons, null, 2)
);
