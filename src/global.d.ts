import { ENV } from "$lib/util/types/canvas";
import type { TinyMCE } from "tinymce";

export {};

declare global {
  interface Window {
    tinymce: TinyMCE;
    ENV: ENV;
    _LOADED_DESIGNBLOCKS?: boolean;
  }
}
