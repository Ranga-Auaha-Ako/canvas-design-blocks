import { CSRF, courseEnv } from "$lib/util/courseEnv";
import { GlossaryStates, RichGlossaryState, getRichGlossary } from "./pageInfo";
import { parse as PapaParse } from "papaparse";

export type termDefinition = {
  term: string;
  definition: string;
  image?: string;
};

/**
 * Glossary handles the parsed state of a glossary page. This includes parsing from HTML, and stringifying to HTML for saving.
 */
export class Glossary {
  static magicToken = "\u200B\u200C\u200B";
  static defaultTitle = "Course Glossary" + Glossary.magicToken;
  static defaultModuleTitle = "Glossary" + Glossary.magicToken;
  /**
   * Attempt to guess URL from title
   * @param title Source title
   */
  static titleToUrl(title: string) {
    return title
      .toLowerCase()
      .replace(/\s/g, "-")
      .replace(/[^\w-]/g, "");
  }
  static defaultURL = Glossary.titleToUrl(Glossary.defaultTitle);
  static fromHTML(state: RichGlossaryState) {
    const container = document.createElement("div");
    container.innerHTML = state.html;
    let institutionDefaults = false;
    const settings = container.querySelector(".CDB--Glossary--Settings");
    if (settings) {
      try {
        const { institutionDefaults: instDefaults } = JSON.parse(
          settings.textContent || "{}"
        );
        institutionDefaults = instDefaults;
      } catch (error) {
        console.error("Error parsing glossary settings:", error);
      }
    }
    const termEls = Array.from(
      container.querySelectorAll(".CDB--Glossary--Term")
    );
    const terms = termEls.map((term) => ({
      term: term.querySelector("dt")?.textContent?.trim() || "",
      definition: term.querySelector("dd")?.innerHTML || "",
      image: term.querySelector("img")?.src,
    }));
    return new Glossary(state, terms, institutionDefaults);
  }
  static async linkExisting(
    config: {
      existingPageUrl?: string;
      existingModuleId?: number;
      pageTitle?: string;
      moduleTitle?: string;
    } = {}
  ) {
    let { existingPageUrl, existingModuleId, pageTitle, moduleTitle } = {
      pageTitle: Glossary.defaultTitle,
      moduleTitle: Glossary.defaultModuleTitle,
      ...config,
    };
    if (!courseEnv.COURSE_ID)
      throw new Error(
        "Course ID not found. Please ensure you are on a course page."
      );
    if (!CSRF)
      throw new Error(
        "CSRF token not found. Try downloading the glossary, reloading the page, and importing it into the page to restore your unsaved changes. If clicking 'Save' still doesn't work, contact support."
      );
    let glossary: Glossary;
    let state: Awaited<ReturnType<typeof getRichGlossary>>;
    // 1. We may need to create a page, a module, or both. We'll start by creating a page.
    if (!existingPageUrl) {
      // Create and save a blank glossary
      glossary = new Glossary({
        title: pageTitle.includes(Glossary.magicToken)
          ? pageTitle
          : pageTitle + Glossary.magicToken,
        url: Glossary.titleToUrl(pageTitle),
      });
      await glossary.save();
      state = {
        ...glossary.state,
        html: glossary.html,
        state: GlossaryStates.GLOSSARY_LINKED,
        published: true,
      };
    } else {
      // Check that there are not any issues with the existing page
      state = await getRichGlossary({
        url: existingPageUrl,
        state: GlossaryStates.GLOSSARY_LINKED,
      });
      glossary = Glossary.fromHTML(state);
    }
    // Fix the title if it's not correct, and publish the page if it's not published
    if (
      !state.published ||
      !glossary.state.title.includes(Glossary.magicToken)
    ) {
      if (!glossary.state.title.includes(Glossary.magicToken)) {
        glossary.state.title = glossary.state.title + Glossary.magicToken;
      }
      // Save glossary back to publish it
      await glossary.save();
    }
    // 2. Create a module if needed
    if (!existingModuleId) {
      // Create the module to link to the page
      if (!moduleTitle.includes(Glossary.magicToken)) {
        moduleTitle = moduleTitle + Glossary.magicToken;
      }
      const res = await fetch(
        `/api/v1/courses/${courseEnv.COURSE_ID}/modules`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-Csrf-Token": CSRF },
          body: JSON.stringify({ module: { name: moduleTitle } }),
        }
      );
      if (!res.ok)
        throw new Error(`Failed to update module: ${await res.text()}`);
      existingModuleId = (await res.json()).id as number;
    }
    // 3. Link the module to the page if needed
    const moduleInfo = await fetch(
      `/api/v1/courses/${courseEnv.COURSE_ID}/modules/${existingModuleId}?include[]=items`,
      {
        method: "GET",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Csrf-Token": CSRF },
      }
    );
    const { items, published } = (await moduleInfo.json()) as {
      items: {
        id: number;
        title: string;
        type: string;
        published?: boolean;
        page_url?: string;
      }[];
      published: boolean;
    };
    const foundPage = items.find(
      (item) => item.type === "Page" && item.page_url === glossary.state.url
    );
    if (!foundPage) {
      // Add the page to the module
      const res = await fetch(
        `/api/v1/courses/${courseEnv.COURSE_ID}/modules/${existingModuleId}/items`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-Csrf-Token": CSRF },
          body: JSON.stringify({
            module_item: {
              title: glossary.state.title,
              type: "Page",
              page_url: glossary.state.url,
            },
          }),
        }
      );
      if (!res.ok)
        throw new Error(
          `Failed to add page to module. Please try again, or contact support.`
        );
    }
    // 4. Publish the module if needed
    if (!published) {
      const res = await fetch(
        `/api/v1/courses/${courseEnv.COURSE_ID}/modules/${existingModuleId}`,
        {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-Csrf-Token": CSRF },
          body: JSON.stringify({ module: { published: true } }),
        }
      );
      if (!res.ok)
        throw new Error(
          `Failed to publish module. Please try again, or contact support.`
        );
    }
    return state;
  }
  constructor(
    public state: Omit<RichGlossaryState, "html" | "state"> = {
      title: Glossary.defaultTitle,
      url: Glossary.defaultURL,
    },
    public terms: termDefinition[] = [],
    public institutionDefaults = false
  ) {}
  /**
   * institutionTerms is a getter that returns the default terms for the institution.
   */
  get institutionTerms() {
    const institutionDefaults = import.meta.env
      .CANVAS_BLOCKS_GLOSSARY_DEFINITIONS;
    if (institutionDefaults) {
      const defaults = JSON.parse(institutionDefaults) as termDefinition[];
      return defaults;
    }
    return [];
  }
  /**
   * allTerms is a getter that returns all terms in the glossary, including institution defaults if enabled.
   */
  get allTerms() {
    return (
      this.institutionDefaults
        ? [
            ...this.institutionTerms,
            ...this.terms.filter(
              (t) =>
                t.term.trim() !== "" &&
                !this.institutionTerms.some(
                  (it) => it.term.toLowerCase() === t.term.toLowerCase()
                )
            ),
          ]
        : this.terms
    ).filter((t) => t.term.trim() !== "");
  }
  /**
   * html is a getter that returns the HTML representation of the glossary. Useful for saving the glossary to the page.
   */
  get html() {
    // Create outer container
    const container = document.createElement("dl");
    container.classList.add("CDB--Glossary");
    // Create inner container to store any settings
    const settings = document.createElement("div");
    settings.classList.add("CDB--Glossary--Settings");
    settings.style.display = "none";
    settings.textContent = JSON.stringify({
      institutionDefaults: this.institutionDefaults,
    });
    container.appendChild(settings);
    for (const term of this.terms.filter((t) => t.term.trim() !== "")) {
      const termOuter = document.createElement("div");
      termOuter.classList.add("CDB--Glossary--Term");
      const image = term.image;
      if (image) {
        const img = document.createElement("img");
        img.src = image;
        img.alt = term.term;
        img.classList.add("CDB--Glossary--Image");
        termOuter.appendChild(img);
      }
      const termEl = document.createElement("dt");
      termEl.textContent = term.term;
      termOuter.appendChild(termEl);
      const definitionEl = document.createElement("dd");
      definitionEl.classList.add("CDB--Glossary--Definition");
      definitionEl.innerHTML = term.definition;
      termOuter.appendChild(definitionEl);
      container.appendChild(termOuter);
    }
    return container.outerHTML;
  }
  /**
   * hasTerms: Whether the glossary has any terms. This is useful for determining whether to show the glossary.
   * @returns A boolean indicating whether the glossary has any terms.
   */
  get hasTerms() {
    return (
      this.allTerms.length > 0 &&
      this.allTerms.some((t) => t.term.trim() !== "")
    );
  }
  /**
   * Parse a CSV file for terms and definitions.
   * @returns A promise that resolves to a termDefinition[] array. This function also updates the internal state of the instance.
   */
  async parseCSV(): Promise<termDefinition[]> {
    const file = await new Promise<File>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.onchange = () => {
        if (input.files?.length) {
          resolve(input.files[0]);
        }
      };
      input.click();
    });
    return await new Promise<termDefinition[]>((resolve, reject) => {
      PapaParse<termDefinition>(file, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (header: string) => {
          if (header.toLowerCase().includes("term")) return "term";
          if (header.toLowerCase().includes("definition")) return "definition";
          return header;
        },
        complete: ({ data, errors }) => {
          if (errors.length) {
            console.error("Failed to parse CSV file because:", errors);
            reject(
              new Error(
                "Failed to parse CSV file. There may be an issue with the file format. Please ensure the file is a CSV file with a header row containing 'Term' and 'Definition' columns."
              )
            );
          }
          if (data.length === 0) {
            reject(
              new Error(
                "You have uploaded an empty CSV file. No terms were found, so no changes were made to the glossary."
              )
            );
          }
          if (data.some(({ term, definition }) => !term && definition))
            throw new Error(
              "Failed to parse CSV file. The 'Term' column must be filled for all definitions."
            );
          resolve(
            data
              .filter(({ term }) => term)
              .map(
                ({ term, definition }) =>
                  ({
                    term: term || "",
                    definition: definition || "",
                  } as termDefinition)
              )
          );
        },
      });
    });
  }
  async save() {
    // Post to API
    if (!CSRF)
      throw new Error(
        "CSRF token not found. Try downloading the glossary, reloading the page, and importing it into the page to restore your unsaved changes. If clicking 'Save' still doesn't work, contact support."
      );
    const res = await fetch(
      `/api/v1/courses/${courseEnv.COURSE_ID}/pages/${this.state.url}`,
      {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Csrf-Token": CSRF,
        },
        body: JSON.stringify({
          wiki_page: {
            title: this.state.title,
            body: this.html,
            published: true,
            notify_of_update: false,
          },
        }),
      }
    );
    const { url, title } = await res.json();
    const prevURL = this.state.url;
    this.state.url = url;

    if (
      courseEnv?.WIKI_PAGE?.url &&
      prevURL === courseEnv?.WIKI_PAGE?.url &&
      url !== prevURL
    ) {
      // If we're on the editor page, redirect to the new page if the URL has changed
      try {
        if (url !== courseEnv.WIKI_PAGE?.url || this.state.url !== url) {
          const newPath = `/courses/${courseEnv.COURSE_ID}/pages/${url}/edit`;
          window.onbeforeunload = null;
          window.location.href = newPath;
        }
      } catch (error) {}
    }
  }
}
