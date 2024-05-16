import escapeStringRegexp from "escape-string-regexp";
import Term from "./clientside/term.svelte";
import DefinitionList from "./clientside/definitionList.svelte";
import { appMode, courseEnv } from "$lib/util/courseEnv";
import Cookie from "js-cookie";
import { parse as PapaParse } from "papaparse";

const CSRF = Cookie.get("_csrf_token");

// The name of the glossary page *should* be "cdb-glossary", but it's possible that it's different. Deleting the page will cause any new glossary to be created with names like "cdb-glossary-1", as the name is based on the title of the page. This is a problem because the glossary editor will only look for a page with the exact name "cdb-glossary". To fix this, we need to get the glossary page by its title, and then use the id to fetch the page contents.

const PAGE_NAME = "Design Blocks: Course Glossary";
const DEFAULT_PAGE_URL = "design-blocks-course-glossary";
const _page_info = new Promise<{ url: string; created: boolean }>(
  async (resolve, reject) => {
    if (!courseEnv.COURSE_ID) return reject("No course ID found");
    const pages = (await fetch(
      `/api/v1/courses/${courseEnv.COURSE_ID}/pages?search_term=${PAGE_NAME}`
    ).then((response) => response.json())) as { title: string; url: string }[];
    const page = pages.find((page) => page.url.includes(DEFAULT_PAGE_URL));
    if (page) {
      resolve({
        created: true,
        url: page.url,
      });
    } else {
      // Page doesn't exist
      resolve({
        created: false,
        url: DEFAULT_PAGE_URL,
      });
    }
  }
);
export const PAGE_CREATED = _page_info.then((info) => info.created);
export const PAGE_URL = _page_info.then((info) => info.url);

export type termDefinition = {
  term: string;
  definition: string;
  image?: string;
};

export type glossaryState = {
  terms: termDefinition[];
  institutionDefaults: boolean;
};

export class GlossaryClientManager {
  public terms: termDefinition[] = [];
  public institutionDefaults: boolean = false;
  public termNodes: HTMLSpanElement[] = [];
  get institutionTerms() {
    const institutionDefaults = import.meta.env
      .CANVAS_BLOCKS_GLOSSARY_DEFINITIONS;
    if (institutionDefaults) {
      const defaults = JSON.parse(institutionDefaults) as termDefinition[];
      return defaults;
    }
    return [];
  }
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
  parseHTML(html: string): glossaryState {
    const container = document.createElement("div");
    container.innerHTML = html;
    const settings = container.querySelector(".CDB--Glossary--Settings");
    if (settings) {
      try {
        const { institutionDefaults } = JSON.parse(
          settings.textContent || "{}"
        );
        this.institutionDefaults = institutionDefaults;
      } catch (error) {
        console.error("Error parsing glossary settings:", error);
      }
    }
    const terms = Array.from(
      container.querySelectorAll(".CDB--Glossary--Term")
    );
    this.terms = terms.map((term) => ({
      term: term.querySelector("dt")?.textContent?.trim() || "",
      definition: term.querySelector("dd")?.innerHTML || "",
      image: term.querySelector("img")?.src,
    }));
    return {
      terms: this.terms,
      institutionDefaults: this.institutionDefaults,
    };
  }

  get json() {
    const state: glossaryState = {
      terms: this.terms
        .filter((t) => t.term.trim() !== "")
        .map((t) => ({
          term: t.term,
          definition: t.definition,
        })),
      institutionDefaults: this.institutionDefaults,
    };
    return JSON.stringify(state);
  }
  get hasTerms() {
    return (
      this.allTerms.length > 0 &&
      this.allTerms.some((t) => t.term.trim() !== "")
    );
  }
  getTermRegex() {
    if (!this.hasTerms) return new RegExp("$^", "i");
    return new RegExp(
      "\\b(" +
        this.allTerms
          .sort((a, b) => {
            // Sort from longest to shortest
            // This will prevent shorter terms from being matched first
            return b.term.length - a.term.length;
          })
          .map((t) => escapeStringRegexp(t.term.trim()))
          .join("|") +
        ")\\b",
      "i"
    );
  }
  constructor() {
    // super(GlossaryState, Glossary, ".CDB--Glossary[data-cdb-version]");
  }
  private termWalker(root: HTMLElement) {
    const regex = this.getTermRegex();
    return document.createTreeWalker(
      root, // The root node of the searched DOM sub-tree.
      NodeFilter.SHOW_ALL, // Look for text nodes only.
      {
        acceptNode(node) {
          // The filter method of interface NodeFilter
          if (node instanceof HTMLElement) {
            if (node.classList.contains("page-title"))
              return NodeFilter.FILTER_REJECT;
            if (node.dataset.cdbId) return NodeFilter.FILTER_REJECT;
          }
          if (!(node instanceof Text)) return NodeFilter.FILTER_SKIP;
          return node.textContent && regex.test(node.textContent) // Check if text contains string
            ? NodeFilter.FILTER_ACCEPT // Found: accept node
            : NodeFilter.FILTER_REJECT; // Not found: reject and continue
        },
      }
    );
  }
  private addGlossaryTags(node: Text) {
    const regex = this.getTermRegex();
    let text = node.textContent;
    let currentMatch;
    let currentNode = node;
    let foundTermNodes = [];
    while (text && (currentMatch = regex.exec(text)) !== null) {
      // Split the text node into three parts: before, matched, and after
      const match = currentNode.splitText(currentMatch.index);
      currentNode = match.splitText(currentMatch[0].length);
      const span = document.createElement("span");
      span.classList.add("CDB--Glossary");
      span.dataset.cdbTerm = currentMatch[0];
      span.textContent = currentMatch[0];
      match.replaceWith(span);
      this.termNodes.push(span);
      foundTermNodes.push(span);
      text = currentNode.textContent;
    }
    return foundTermNodes;
  }
  private _hasLoaded = false;
  async htmlSandbox(html: string) {
    const container = document.createElement("iframe");
    // Enable sandboxing, disallowing scripts
    container.sandbox.add("allow-same-origin");
    // Set the source document
    container.srcdoc = html;
    // Hide
    container.style.display = "none";
    // Append to body
    document.body.appendChild(container);
  }
  async loadData() {
    document.body.insertAdjacentText("afterbegin", "Loading glossary...");
    try {
      if (this._hasLoaded) return;
      this._hasLoaded = true;
      let body = "";
      // First, get the glossary page (if it exists)
      if (appMode === "desktop") {
        const glossaryPage = await fetch(
          `/api/v1/courses/${courseEnv.COURSE_ID}/pages/${await PAGE_URL}`
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            return null;
          })
          .catch(() => null);
        if (!glossaryPage) return;
        body = glossaryPage.body;
      } else {
        // On mobile there is no permission to fetch API data, so we need to get the data from the page itself
        // 1. Fetch list of pages for this course
        document.body.insertAdjacentHTML(
          "beforeend",
          `<h1>Debug 1: Course Page List ${courseEnv.COURSE_ID}</h1>`
        );
        const pages = await fetch(`/courses/${courseEnv.COURSE_ID}/pages`).then(
          (r) => r.text()
        );
        // DEBUG: add to DOM for debugging
        let debug = document.createElement("pre");
        debug.textContent = pages;
        document.body.appendChild(debug);
        document.body.insertAdjacentHTML(
          "beforeend",
          `<h1>Debug 2: Glossary Page ${courseEnv.COURSE_ID}</h1>`
        );
        const page2 = await fetch(
          `/courses/${courseEnv.COURSE_ID}/pages/design-blocks-course-glossary`
        ).then((r) => r.text());
        // DEBUG: add to DOM for debugging
        let debug2 = document.createElement("pre");
        debug2.textContent = page2;
        document.body.appendChild(debug2);
      }
      // Then, get the glossary terms (if they exist)
      try {
        // const state: glossaryState = JSON.parse(body);
        const state = this.parseHTML(body);
        this.terms = state.terms;
        this.institutionDefaults = state.institutionDefaults;
      } catch (error) {
        return;
      }
    } catch (error) {
      document.body.insertAdjacentText(
        "beforeend",
        `There was an error loading the glossary: ${error}`
      );
    }
  }

  public onEditorPage = false;
  async renderClientComponent(force: boolean = false) {
    if (!force && document.readyState !== "complete") {
      // Come back when the page is fully loaded
      window.addEventListener("load", () => this.renderClientComponent(true));
      return;
    }
    // If we're on the glossary page, render the viewer or editor
    if (courseEnv?.WIKI_PAGE?.url === (await PAGE_URL)) {
      const contents = courseEnv.WIKI_PAGE.body;
      let parsed: glossaryState = {
        terms: [],
        institutionDefaults: false,
      };
      try {
        parsed = this.parseHTML(contents);
      } catch (error) {
        console.error("Error parsing glossary page:", error);
      }
      const container = document.getElementById("content");
      if (!container) return;
      document.body.classList.add("cdb-glossary-editor-active");
      const { GlossaryEditor, GlossaryViewer } = await import(
        "./glossaryLoader"
      );
      if (document.location.pathname.endsWith("/edit")) {
        this.onEditorPage = true;
        new GlossaryEditor({
          target: container,
          props: {
            glossaryData: parsed,
            manager: this,
          },
          intro: true,
        });
      } else {
        new GlossaryViewer({
          target: container,
          props: {
            glossaryData: parsed,
            manager: this,
          },
          intro: true,
        });
      }
      return;
    }
    const glossaryEls = document.querySelectorAll<HTMLDivElement>(
      import.meta.env.MODE.includes("mobile")
        ? "#content"
        : "div#wiki_page_show .user_content"
    );
    if (glossaryEls.length === 0) return;
    await this.loadData();
    // If there are no terms, return
    if (!this.hasTerms) return;
    // Add glossary tags to the page
    glossaryEls.forEach((el) => {
      const iterator = this.termWalker(el);
      let results = [];
      let foundTermNodes: HTMLElement[] = [];
      while (iterator.nextNode()) {
        results.push(iterator.currentNode);
      }
      results.forEach((node) => {
        foundTermNodes.push(...this.addGlossaryTags(node as Text));
      });
      new DefinitionList({
        target: el,
        props: {
          terms: this.allTerms,
          termNodes: foundTermNodes,
        },
      });
    });
    // Render the glossary component
    console.log("Rendering Glossary");
    console.log(this.termNodes);
    this.termNodes.forEach((termNode) => {
      const term = termNode.dataset.cdbTerm;
      if (!term) return;
      const definition = this.allTerms.find(
        (t) => t.term.toLowerCase() === term.toLowerCase()
      )?.definition;
      if (!definition) return;
      termNode.innerHTML = "";
      new Term({
        target: termNode,
        props: {
          term,
          definition,
        },
      });
    });
  }

  async parseCSV(): Promise<termDefinition[]> {
    // Load a file and update the glossary
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
      `/api/v1/courses/${courseEnv.COURSE_ID}/pages/${await PAGE_URL}`,
      {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Csrf-Token": CSRF,
        },
        body: JSON.stringify({
          wiki_page: {
            title: PAGE_NAME,
            body: this.html,
            published: true,
            notify_of_update: false,
          },
        }),
      }
    );
    if (this.onEditorPage) {
      // If we're on the editor page, redirect to the new page if the URL has changed
      try {
        const { url } = await res.json();
        if (url !== courseEnv.WIKI_PAGE?.url || (await PAGE_URL) !== url) {
          const newPath = `/courses/${courseEnv.COURSE_ID}/pages/${url}/edit`;
          window.onbeforeunload = null;
          window.location.href = newPath;
        }
      } catch (error) {}
    }
  }
}

export default new GlossaryClientManager();
