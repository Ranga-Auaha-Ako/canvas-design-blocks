import glossaryClientManager from "$lib/elements/glossary/glossaryClientManager";
import { courseEnv } from "$lib/util/courseEnv";

import.meta.glob("$lib/elements/*/element.postcss", {
  eager: true,
});

// Determine whether to load client-side blocks
export const shouldLoadClientSide =
  !import.meta.env.CANVAS_BLOCKS_CLIENTSIDE_OPTIN ||
  (
    JSON.parse(import.meta.env.CANVAS_BLOCKS_CLIENTSIDE_OPTIN) as string[]
  ).includes(courseEnv.ACCOUNT_ID);

// These are the client-side managers that are loaded always
export const clientManagers: { renderClientComponent: () => unknown }[] =
  shouldLoadClientSide ? [glossaryClientManager] : [];
