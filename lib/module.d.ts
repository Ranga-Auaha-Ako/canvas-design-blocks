declare module "virtual:inst-icons" {
  /**
   * A record of icon names and their corresponding data URIs.
   * - The key is the icon name, e.g. `Solid.arrow-right`.
   * - The value is one of two possibilities:
   *   - In theme mode, the value is a url to the icon file.
   *   - In dev and chrome extension mode, the value is a data URI of the icon file.
   */
  export const icons: Record<string, string>;
}
declare module "virtual:inst-env";

declare module "virtual:blocks-icons" {
  import type { IconSet as IconSetType } from "$lib/icons/vite/icons";
  export default IconSetType.prototype.iconSearchList;
}
declare module "virtual:blocks-icons-editor-styles" {
  export default string;
}
