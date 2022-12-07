import type { TinyMCE } from "tinymce";

export {};

declare global {
  interface Window {
    tinymce: TinyMCE;
  }
}

declare module "unit-to-px" {
  export default function unitToPx(cssLength: string): number;
}
