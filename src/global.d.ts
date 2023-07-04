import type { TinyMCE } from "tinymce";

export {};

declare global {
  interface Window {
    tinymce: TinyMCE;
    ENV: { COURSE_ID: string };
  }
}

declare module "unit-to-px" {
  export default function unitToPx(cssLength: string): number;
}
