/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __IS_SANDPIT__: boolean;
declare const __APP_NAME__: string | undefined;
declare const __LATEST_CHANGE__: string;
declare const __LATEST_CHANGE_VERSION__: string | null;
declare const __THEME__:
  | {
      primary?: string;
      secondary?: string;
      faculty?: Record<string, string>;
      palette?: {
        dark: Record<string, string>;
        light: Record<string, string>;
      };
    }
  | undefined;

interface ImportMetaEnv {
  readonly CANVAS_BLOCKS_BASE_DOMAINS: string;
  readonly CANVAS_BLOCKS_THEME: string;
  readonly CANVAS_BLOCKS_USE_CANVAS_ICONS: string;
  readonly CANVAS_BLOCKS_GLOSSARY_DEFINITIONS: string;
}
