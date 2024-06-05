import { courseEnv } from "$lib/util/courseEnv";
import type { GlossaryClientManager } from "./glossaryClientManager";

// This file determines where the glossary data is served from, and will potentially flag the user to create a glossary or relink the glossary page if required.
export enum GlossaryStates {
  // The glossary page does not exist.
  NO_GLOSSARY,
  // The glossary page exists, but is not linked to the course modules.
  GLOSSARY_UNLINKED,
  // The glossary page exists and is linked to the course modules, but is hidden to students.
  GLOSSARY_HIDDEN_MODULE,
  GLOSSARY_HIDDEN_PAGE,
  // The glossary page exists and is linked to the course modules.
  GLOSSARY_LINKED,
}

export type ResolvedGlossaryState = {
  state: GlossaryStates.GLOSSARY_LINKED;
  url: string;
};

export type UnResolvedGlossaryState =
  | {
      state: GlossaryStates.GLOSSARY_HIDDEN_MODULE;
      module_id: number;
    }
  | {
      state: GlossaryStates.GLOSSARY_HIDDEN_PAGE;
      page_url: string;
    }
  | {
      state: GlossaryStates.GLOSSARY_UNLINKED;
      page_matches: string[];
    }
  | {
      state: GlossaryStates.NO_GLOSSARY;
    };

export type GlossaryState = ResolvedGlossaryState | UnResolvedGlossaryState;
/**
 * Fetches the glossary state for the current course. This function will return a promise that resolves to the glossary, a list of potential glossary pages, or NO_GLOSSARY if no glossary is found.
 * @returns A promise that resolves to the glossary state. See the `GlossaryState` type for more information.
 */
export async function getGlossaryState(): Promise<GlossaryState> {
  if (!courseEnv.COURSE_ID) {
    throw new Error("Course ID is not available. No glossary to find.");
  }
  // Step 1: Search Modules for Glossary
  // - If Glossary is found, return GLOSSARY_LINKED
  const modules = await fetch(
    `/api/v1/courses/${courseEnv.COURSE_ID}/modules?per_page=100&include[]=items`
  )
    .then(async (res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch modules: Status ${
            res.status
          }. Details: ${await res.text()}`
        );
      const json = (await res.json()) as {
        id: number;
        name: string;
        /**
         * Students will have published: undefined, Teachers will have published: boolean
         */
        published?: boolean;
        position?: number;
        items: (
          | {
              id: number;
              title: string;
              type: string;
              published?: boolean;
            }
          | {
              id: number;
              title: string;
              type: "Page";
              page_url: string;
              published?: boolean;
            }
        )[];
      }[];
      if (!json || !json.length) return null;
      const sortedModules = json.sort((a, b) => {
        // Sort by position (low to high)
        if (a.position && b.position) return a.position - b.position;
        if (a.position) return -1;
        if (b.position) return 1;
        // Leave in original order
        return 0;
      });
      const exactMatch = sortedModules.find((module) =>
        // These unicode characters are used to ensure that the glossary page is found even if the name is not an exact match.
        module.name.toLowerCase().includes("\u2009\u2008\u200A")
      );
      if (exactMatch) {
        if (exactMatch.published === false) {
          return {
            state: GlossaryStates.GLOSSARY_HIDDEN_MODULE as const,
            module_id: exactMatch.id,
          };
        }
        const page = exactMatch.items.find(
          (
            item
          ): item is Extract<(typeof exactMatch.items)[0], { type: "Page" }> =>
            item.type === "Page"
        );
        if (page) {
          if (page.published === false) {
            return {
              state: GlossaryStates.GLOSSARY_HIDDEN_PAGE as const,
              page_url: page.page_url,
            };
          }
          return {
            state: GlossaryStates.GLOSSARY_LINKED as const,
            url: page.page_url,
          };
        }
      }
      return null;
    })
    .catch(() => {
      console.error("Failed to fetch modules.");
      return null;
    });
  if (modules) return modules;
  // Step 2: Search Pages for Glossary
  // - If Glossary is found, return GLOSSARY_UNLINKED
  const pages = await fetch(
    `/api/v1/courses/${courseEnv.COURSE_ID}/pages?per_page=100`
  )
    .then(async (res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch pages: Status ${
            res.status
          }. Details: ${await res.text()}`
        );
      const json = (await res.json()) as {
        url: string;
        title: string;
        published?: boolean;
      }[];
      if (!json || !json.length) return null;
      const possibleMatches = json.filter(
        (page) =>
          // These unicode characters are used to ensure that the glossary page is found even if the name is not an exact match.
          page.title.toLowerCase().includes("\u2009\u2008\u200A") ||
          page.title.toLowerCase().includes("glossary")
      );
      if (possibleMatches.length > 0) {
        return {
          state: GlossaryStates.GLOSSARY_UNLINKED as const,
          page_matches: possibleMatches.map((page) => page.url),
        };
      }
      return null;
    })
    .catch(() => {
      console.error("Failed to fetch pages.");
      return null;
    });
  if (pages) return pages;
  // Step 3: Return NO_GLOSSARY
  return { state: GlossaryStates.NO_GLOSSARY };
}

export let glossaryState: Promise<GlossaryState> = getGlossaryState();
/**
 * RichGlossaryState is a resolved glossary with the contents of the page
 */
export type RichGlossaryState = ResolvedGlossaryState & {
  html: string;
  title: string;
};

let _retryCounter = 0;
/**
 * Active function: Will only ever return a resolved RichGlossaryState. If the glossary is unlinked, the user will be prompted to link the glossary. If the glossary does not exist, the user will be prompted to create the glossary.
 * @returns A promise that resolves to the `ResolvedGlossaryState` type.
 */
export async function getResolvedGlossary(): Promise<RichGlossaryState> {
  try {
    const state = await glossaryState;
    if (state.state === GlossaryStates.GLOSSARY_UNLINKED) {
      // Prompt the user to link the glossary.
      throw new Error(
        `Glossary is unlinked. Please link the glossary to the course modules. Possible matches: ${state.page_matches.join(
          ", "
        )}`
      );
    }
    if (
      state.state === GlossaryStates.GLOSSARY_HIDDEN_MODULE ||
      state.state === GlossaryStates.GLOSSARY_HIDDEN_PAGE
    ) {
      // Prompt the user to unhide the glossary.
      throw new Error(`Glossary is hidden. Please unhide the glossary page.`);
    }
    if (state.state === GlossaryStates.NO_GLOSSARY) {
      // Prompt the user to create the glossary.
      throw new Error("No glossary found. Please create a glossary page.");
    }
    // Get page data
    const pageData = await fetch(
      `/api/v1/courses/${courseEnv.COURSE_ID}/page/${state.url}`
    ).then(async (res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch page data: Status ${
            res.status
          }. Details: ${await res.text()}`
        );
      return (await res.json()) as { body: string; title: string };
    });
    return {
      ...state,
      title: pageData.title,
      html: pageData.body,
    };
  } catch (error) {
    // Allow for intermittent failures
    if (_retryCounter < 3) {
      _retryCounter++;
      return await new Promise((resolve) =>
        setTimeout(() => {
          resolve(getResolvedGlossary());
        }, 1000)
      );
    } else {
      throw error;
    }
  }
}
