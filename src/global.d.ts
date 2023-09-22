import type { TinyMCE } from "tinymce";

export {};

declare global {
  interface Window {
    tinymce: TinyMCE;
    _LOADED_DESIGNBLOCKS?: boolean;
  }
}

declare module "unit-to-px" {
  export default function unitToPx(cssLength: string): number;
}
