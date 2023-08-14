/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __ISTHEME__: boolean;

interface ImportMetaEnv {
  readonly CANVAS_BLOCKS_BASE_DOMAINS: string;
}
