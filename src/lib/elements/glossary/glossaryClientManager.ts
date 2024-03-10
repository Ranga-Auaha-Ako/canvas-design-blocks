import escapeStringRegexp from "escape-string-regexp";
import Term from "./clientside/term.svelte";
import DefinitionList from "./clientside/definitionList.svelte";
import GlossaryEditor from "./glossaryEditor.svelte";
import { courseEnv } from "$lib/util/courseEnv";
import GlossaryViewer from "./glossaryViewer.svelte";
import "./glossary.postcss";
import Cookie from "js-cookie";

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

export type termDefinition = { term: string; definition: string };

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
        ? [...this.terms, ...this.institutionTerms]
        : this.terms
    ).filter((t) => t.term.trim() !== "");
  }

  get json() {
    const state: glossaryState = {
      terms: this.terms,
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
        this.allTerms.map((t) => escapeStringRegexp(t.term)).join("|") +
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
  async loadData() {
    if (this._hasLoaded) return;
    this._hasLoaded = true;
    // First, get the glossary page (if it exists)
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
    const body = glossaryPage.body;
    // Then, get the glossary terms (if they exist)
    try {
      const state: glossaryState = JSON.parse(body);
      this.terms = state.terms;
      this.institutionDefaults = state.institutionDefaults;
    } catch (error) {
      return;
    }
  }

  public onEditorPage = false;
  async renderClientComponent() {
    // If we're on the glossary page, and the url ends in "/edit", render the editor
    if (courseEnv?.WIKI_PAGE?.url === (await PAGE_URL)) {
      const contents = courseEnv.WIKI_PAGE.body;
      const container = document.getElementById("content");
      if (!container) return;
      document.body.classList.add("cdb-glossary-editor-active");
      if (document.location.pathname.endsWith("/edit")) {
        this.onEditorPage = true;
        new GlossaryEditor({
          target: container,
          props: {
            glossaryData: contents,
            manager: this,
          },
          intro: true,
        });
      } else {
        new GlossaryViewer({
          target: container,
          props: {
            glossaryData: contents,
            manager: this,
          },
          intro: true,
        });
      }
      return;
    }
    const glossaryEls = document.querySelectorAll<HTMLDivElement>(
      "div#wiki_page_show .user_content"
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

  async loadFile() {
    // Load a file and update the glossary
    const file = await new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.onchange = () => {
        if (input.files?.length) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result);
          };
          reader.readAsText(input.files[0]);
        }
      };
      input.click();
    });
    if (typeof file === "string") {
      try {
        const [_headers, ...lines] = file.split("\n");
        const terms = lines.map((line) => {
          const [term, definition, ...more] = line.split(",");
          if (more.length > 0)
            throw new Error(
              "Glossary file has too many columns: make sure the file is in the correct format."
            );
          return { term, definition };
        });
        if (terms.some((term) => !term.term || !term.definition))
          throw new Error(
            "Glossary file is corrupt or not in the correct format. Make sure you uploaded the correct file."
          );
        this.terms = terms;
        return true;
      } catch (error) {
        console.error("Issue reading CSV file:", error);
      }
    }
    throw new Error(
      "Failed to read the file. Please ensure you are uploading a glossary file generated by this editor."
    );
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
            body: this.json,
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
