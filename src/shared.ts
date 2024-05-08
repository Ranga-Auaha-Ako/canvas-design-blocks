import glossaryClientManager from "$lib/elements/glossary/glossaryClientManager";

import.meta.glob("$lib/elements/*/element.postcss", {
  eager: true,
});
// These are the client-side managers that are loaded always
export const clientManagers: { renderClientComponent: () => unknown }[] = [
  glossaryClientManager,
];
