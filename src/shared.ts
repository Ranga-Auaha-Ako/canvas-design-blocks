import glossaryClientManager from "$lib/elements/glossary/glossaryClientManager";
import { accountIDPromise, courseEnv } from "$lib/util/courseEnv";

// Handle dark mode
import "$lib/util/darkMode";

import.meta.glob("$lib/elements/*/element.postcss", {
  eager: true,
});

// Determine whether to load client-side blocks
export const shouldLoadClientSide = accountIDPromise.then(
  (accountID) =>
    !!accountID &&
    (!import.meta.env.CANVAS_BLOCKS_CLIENTSIDE_OPTIN ||
      (
        JSON.parse(import.meta.env.CANVAS_BLOCKS_CLIENTSIDE_OPTIN) as string[]
      ).includes(accountID))
);

// These are the client-side managers that are loaded always
export const clientManagers = shouldLoadClientSide.then<
  { renderClientComponent: () => unknown }[]
>((shouldLoad) =>
  shouldLoad
    ? [
        // glossaryClientManager
      ]
    : []
);
