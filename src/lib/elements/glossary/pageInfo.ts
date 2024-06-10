import { CSRF, courseEnv } from "$lib/util/courseEnv";
import PageMatcher from "./components/pageMatcher.svelte";
import { Glossary } from "./pageParser";

// This file determines where the glossary data is served from, and will potentially flag the user to create a glossary or relink the glossary page if required.
/**
 * Represents the possible states of a glossary page.
 */
export enum GlossaryStates {
  /**
   * The glossary page does not exist.
   */
  NO_GLOSSARY,
  /**
   * The glossary page exists, but is not linked to the course modules.
   */
  GLOSSARY_UNLINKED,
  /**
   * The glossary page exists and is linked to the course modules, but *the module* is hidden to students.
   */
  GLOSSARY_HIDDEN_MODULE,
  /**
   * The glossary page exists and is linked to the course modules, but *the page* is hidden to students.
   */
  GLOSSARY_HIDDEN_PAGE,
  /**
   * The glossary page exists and is linked to the course modules.
   */
  GLOSSARY_LINKED,
}

export type ResolvedGlossaryState = {
  state: GlossaryStates.GLOSSARY_LINKED;
  module_id?: number;
  url: string;
};

export type UnResolvedGlossaryState =
  | {
      state: GlossaryStates.GLOSSARY_HIDDEN_MODULE;
      module_id: number;
      url?: string;
    }
  | {
      state: GlossaryStates.GLOSSARY_HIDDEN_PAGE;
      module_id?: number;
      url: string;
    }
  | {
      state: GlossaryStates.GLOSSARY_UNLINKED;
      page_matches: { url: string; title: string }[];
      module_id?: number;
    }
  | {
      state: GlossaryStates.NO_GLOSSARY;
      module_id?: number;
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
  if (!CSRF)
    throw new Error(
      "CSRF token not found. Try downloading the glossary, reloading the page, and importing it into the page to restore your unsaved changes. If clicking 'Save' still doesn't work, contact support."
    );
  // Step 1: Search Modules for Glossary
  // - If Glossary is found, return GLOSSARY_LINKED
  const modules: GlossaryState | null = await fetch(
    `/api/v1/courses/${courseEnv.COURSE_ID}/modules?per_page=100&include[]=items`
  )
    .then(async (res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch modules: Status ${res.status}. Please try again or contact support.`
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
        module.name.includes(Glossary.magicToken)
      );
      if (exactMatch) {
        const page = exactMatch.items.find(
          (
            item
          ): item is Extract<(typeof exactMatch.items)[0], { type: "Page" }> =>
            item.type === "Page" && item.title.includes(Glossary.magicToken)
        );
        if (exactMatch.published === false) {
          return {
            state: GlossaryStates.GLOSSARY_HIDDEN_MODULE as const,
            module_id: exactMatch.id,
            url: page?.page_url,
          };
        }
        if (page) {
          if (page.published === false) {
            return {
              state: GlossaryStates.GLOSSARY_HIDDEN_PAGE as const,
              module_id: exactMatch.id,
              url: page.page_url,
            };
          }
          return {
            state: GlossaryStates.GLOSSARY_LINKED as const,
            module_id: exactMatch.id,
            url: page.page_url,
          };
        } else {
          return {
            state: GlossaryStates.GLOSSARY_UNLINKED as const,
            module_id: exactMatch.id,
            page_matches: [],
          };
        }
      }
      return null;
    })
    .catch(() => {
      console.error("Failed to fetch modules.");
      return null;
    });
  if (modules && modules.state !== GlossaryStates.GLOSSARY_UNLINKED)
    return modules;
  // Step 2: Search Pages for Glossary
  // - If Glossary is found, return GLOSSARY_UNLINKED
  const pages = await fetch(
    `/api/v1/courses/${courseEnv.COURSE_ID}/pages?per_page=100`
  )
    .then(async (res) => {
      if (!res.ok)
        throw new Error(
          `Failed to fetch pages: Status ${res.status}. Please try again or contact support.`
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
          page.title.includes(Glossary.magicToken) ||
          page.title.toLowerCase().includes("glossary")
      );
      let validMatches: typeof possibleMatches = [];
      for (const page of possibleMatches) {
        const exists = await Glossary.checkExisting(page.url);
        if (exists) validMatches.push(page);
      }

      if (validMatches.length > 0) {
        return {
          state: GlossaryStates.GLOSSARY_UNLINKED as const,
          page_matches: validMatches.map(({ url, title }) => ({
            url,
            title,
          })),
          module_id: modules?.module_id,
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
  return { state: GlossaryStates.NO_GLOSSARY, module_id: modules?.module_id };
}

export let glossaryState: Promise<GlossaryState> = getGlossaryState();
/**
 * RichGlossaryState is a resolved glossary with the contents of the page
 */
export type RichGlossaryState = ResolvedGlossaryState & {
  html: string;
  title: string;
};

class UserExit extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserExit";
  }
}

/**
 * Retrieves the rich glossary state by fetching page data for the resolved glossary.
 * @param state - The resolved glossary state.
 * @returns A promise that resolves to the rich glossary state.
 */
export async function getRichGlossary(
  state: ResolvedGlossaryState
): Promise<RichGlossaryState & { published: boolean }> {
  // Get page data for resolved glossary
  const pageData = await fetch(
    `/api/v1/courses/${courseEnv.COURSE_ID}/pages/${state.url}`
  ).then(async (res) => {
    if (!res.ok)
      throw new Error(
        `Failed to fetch page data: Status ${res.status}. Please try again or contact support.`
      );
    return (await res.json()) as {
      body: string;
      title: string;
      published: boolean;
    };
  });
  return {
    ...state,
    title: pageData.title,
    html: pageData.body,
    published: pageData.published,
  };
}

let _retryCounter = 0;
/**
 * Active function: Will only ever return a resolved RichGlossaryState. If the glossary is unlinked, the user will be prompted to link the glossary. If the glossary does not exist, the user will be prompted to create the glossary.
 * @returns A promise that resolves to the `ResolvedGlossaryState` type.
 */
export async function getResolvedGlossary(
  statePromise: Promise<
    ResolvedGlossaryState | UnResolvedGlossaryState
  > = glossaryState
): Promise<RichGlossaryState> {
  try {
    let state = await statePromise;
    // If the state is not resolved, wait for the user to resolve it.
    // if (((s): s is UnResolvedGlossaryState=>(s.state !== GlossaryStates.GLOSSARY_LINKED))(state)) {
    if (state.state !== GlossaryStates.GLOSSARY_LINKED) {
      const newState = await new Promise<ResolvedGlossaryState>(
        (resolve, reject) => {
          const pageMatcher = new PageMatcher({
            target: document.body,
            props: {
              glossaryState: state as UnResolvedGlossaryState,
            },
          });
          pageMatcher.$on("saved", ({ detail }) => {
            glossaryState = Promise.resolve(detail);
            resolve(detail);
          });
          pageMatcher.$on("close", () => {
            reject(new UserExit("Glossary page not linked."));
          });
        }
      );
      state = newState;
    }
    return await getRichGlossary(state);
  } catch (error) {
    // Allow for intermittent failures
    if (!(error instanceof UserExit) && _retryCounter < 3) {
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
