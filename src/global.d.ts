import { ENV } from "$lib/util/types/canvas";
import type { TinyMCE } from "tinymce";

export {};

declare global {
  interface Window {
    tinymce: TinyMCE;
    ENV: ENV;
    dataLayer?: any[];
    _LOADED_DESIGNBLOCKS?: string;
    _UNLOAD_DESIGNBLOCKS?: () => boolean;
  }
}
