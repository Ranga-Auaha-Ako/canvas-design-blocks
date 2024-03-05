import { ClientElementManager } from "../generic/client-enabled/svelteClientManager";
import escapeStringRegexp from "escape-string-regexp";
import Term from "./clientside/term.svelte";
import DefinitionList from "./clientside/definitionList.svelte";
import GlossaryEditor from "./glossaryEditor.svelte";
import { ElementComponent, SvelteElement } from "../generic/svelteElement";
import { courseEnv } from "$lib/util/courseEnv";

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
    return this.institutionDefaults
      ? [...this.terms, ...this.institutionTerms]
      : this.terms;
  }
  getTermRegex() {
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
  termWalker(root: HTMLElement) {
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
  addGlossaryTags(node: Text) {
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
  async renderClientComponent() {
    // If we're on the glossary page, and the url ends in "/edit", render the editor
    if (
      courseEnv?.WIKI_PAGE?.url === "cdb-glossary" &&
      document.location.pathname.endsWith("/edit")
    ) {
      const contents = courseEnv.WIKI_PAGE.body;
      const container = document.getElementById("content");
      if (!contents || !container) return;
      document.body.classList.add("cdb-glossary-editor-active");
      new GlossaryEditor({
        target: container,
        props: {
          glossaryData: contents,
          manager: this,
        },
      });
      return;
    }
    const glossaryEls =
      document.querySelectorAll<HTMLDivElement>("div#wiki_page_show");
    if (glossaryEls.length === 0) return;
    // First, get the glossary page (if it exists)
    const glossaryPage = await fetch(
      `/api/v1/courses/${courseEnv.COURSE_ID}/pages/cdb-glossary`
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
}

export default new GlossaryClientManager();
