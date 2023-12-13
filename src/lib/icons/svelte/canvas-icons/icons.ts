export interface customIcon {
  id: string;
  url: string;
  title?: string;
  width: number;
  height: number;
  tnp_id: string;
  tags: string[];
  term: string;
  collections: string[];
}

export interface instIcon {
  id: string;
  term: string;
  url: string;
}

export enum IconType {
  Solid = 0,
  Line = 1,
  Custom = 2,
}

export interface instCategory {
  name: string;
  type: IconType.Line | IconType.Solid;
  icons: instIcon[];
}
export interface customCategory {
  name: string;
  type: IconType.Custom;
  icons: customIcon[];
}

export type iconData = Array<instCategory | customCategory>;

/**
 * Custom icons meta data - this is what a canvas icons build will return.
 * We will add the type to the category to make it a custom category.
 */
export type customIconsMeta = {
  name: string;
  icons: customIcon[];
}[];

export const getIconClass = (url: string): string => {
  // eg : svg-Aotearoa--noun_Beehive_147848
  // eg : svg-Aotearoa--noun-Beehive-147848
  // Strip svg from end
  url = url.replace(/\.svg$/, "");
  url = url.replace(/\s/g, "-");
  url = url.replace(/_/g, "-");
  // Split into folders
  const parts = url.split("/");
  return `${parts.join("--")}`;
};

export const isCustomCategory = (
  cat: Pick<instCategory | customCategory, "type">
): cat is customCategory => cat.type === IconType.Custom;
export const isInstCategory = (
  cat: Pick<instCategory | customCategory, "type">
): cat is instCategory => !isCustomCategory(cat);
