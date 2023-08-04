/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __USES_CANVAS_ICONS__: boolean;

interface ImportMetaEnv {
  readonly CANVAS_BLOCKS_BASE_DOMAINS: string;
  readonly CANVAS_BLOCKS_ICONS_ASSET_HOST: string;
  readonly CANVAS_BLOCKS_ICONS_HOST: string;
}
