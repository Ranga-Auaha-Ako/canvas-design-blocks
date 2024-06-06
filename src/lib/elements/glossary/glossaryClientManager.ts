import escapeStringRegexp from "escape-string-regexp";
import Term from "./clientside/term.svelte";
import DefinitionList from "./clientside/definitionList.svelte";
import { courseEnv } from "$lib/util/courseEnv";
import Cookie from "js-cookie";
import { persisted } from "svelte-persisted-store";
import { Glossary, termDefinition } from "./pageParser";
import { GlossaryStates, getRichGlossary, glossaryState } from "./pageInfo";

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

export const GLOSSARY_ENABLED = persisted("cdb-glossary-enabled", true);

export type glossaryState = {
  terms: termDefinition[];
  institutionDefaults: boolean;
};

/**
 * Manages the client-side functionality for the glossary.
 */
export class GlossaryClientManager {
  public terms: termDefinition[] = [];
  public institutionDefaults: boolean = false;
  public termNodes: HTMLSpanElement[] = [];
  public glossary: Glossary | undefined;

  getTermRegex() {
    if (!this.glossary?.hasTerms) return new RegExp("$^", "i");
    return new RegExp(
      "\\b(" +
        this.glossary.allTerms
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
    const InteractiveTags = new Set([
      "A",
      "BUTTON",
      "TEXTAREA",
      "INPUT",
      "IFRAME",
      "DETAILS",
      "DIALOG",
      "SELECT",
    ]);
    return document.createTreeWalker(
      root, // The root node of the searched DOM sub-tree.
      NodeFilter.SHOW_ALL, // Look for text nodes only.
      {
        acceptNode(node) {
          // The filter method of interface NodeFilter
          if (node instanceof HTMLElement) {
            if (InteractiveTags.has(node.tagName))
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
  public onEditorPage = false;

  /**
   * Renders the client component for the glossary.
   *
   * @param force - A boolean indicating whether to force the rendering even if the page is not fully loaded.
   * @returns A Promise that resolves once the client component is rendered.
   */
  async renderClientComponent(force: boolean = false) {
    if (import.meta.env.MODE.includes("mobile")) {
      // For now, the mobile app is not suported.
      return;
    }
    if (!force && document.readyState !== "complete") {
      // Come back when the page is fully loaded
      window.addEventListener("load", () => this.renderClientComponent(true));
      return;
    }
    // If we're on the glossary page, render the viewer or editor
    if (
      courseEnv?.WIKI_PAGE &&
      courseEnv?.WIKI_PAGE?.url === (await PAGE_URL)
    ) {
      const contents = courseEnv.WIKI_PAGE.body;
      const glossary = Glossary.fromHTML({
        state: GlossaryStates.GLOSSARY_LINKED,
        html: contents,
        url: courseEnv.WIKI_PAGE.url,
        title: courseEnv.WIKI_PAGE.title,
      });
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
            glossaryData: glossary,
          },
          intro: true,
        });
      } else {
        new GlossaryViewer({
          target: container,
          props: {
            glossaryData: glossary,
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
    const state = await glossaryState;
    if (state.state !== GlossaryStates.GLOSSARY_LINKED) return;
    const richState = await getRichGlossary(state);
    const glossary = Glossary.fromHTML(richState);
    // If there are no terms, return
    if (!glossary.hasTerms) return;
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
          terms: glossary.allTerms,
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
      const definition = glossary.allTerms.find(
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
}

export default new GlossaryClientManager();
