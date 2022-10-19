import type { TinyMCE } from "tinymce";

export {};

declare global {
  interface Window {
    tinymce: TinyMCE;
  }
}
