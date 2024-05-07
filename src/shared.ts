import glossaryClientManager from "$lib/elements/glossary/glossaryClientManager";

// These are the client-side managers that are loaded always
export const clientManagers: { renderClientComponent: () => unknown }[] = [
  glossaryClientManager,
];
