import { ClientElementManager } from "../generic/client-enabled/svelteClientManager";
import escapeStringRegexp from "escape-string-regexp";
import Term from "./clientside/term.svelte";
import DefinitionList from "./clientside/definitionList.svelte";
import GlossaryEditor from "./glossaryEditor.svelte";
import { ElementComponent, SvelteElement } from "../generic/svelteElement";

export type termDefinition = { term: string; definition: string };

class GlossaryClientManager {
  public terms: termDefinition[] = [];
  public termNodes: HTMLSpanElement[] = [];
  getTermRegex() {
    return new RegExp(
      "\\b(" +
        this.terms.map((t) => escapeStringRegexp(t.term)).join("|") +
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
      window.ENV?.WIKI_PAGE?.url === "cdb-glossary" &&
      document.location.pathname.endsWith("/edit")
    ) {
      const contents = window.ENV.WIKI_PAGE.body;
      const container = document.getElementById("content");
      if (!contents || !container) return;
      document.body.classList.add("cdb-glossary-editor-active");
      new GlossaryEditor({
        target: container,
        props: {
          glossaryData: contents,
        },
      });
      return;
    }
    const glossaryEls =
      document.querySelectorAll<HTMLDivElement>("div#wiki_page_show");
    if (glossaryEls.length === 0) return;
    // First, get the glossary page (if it exists)
    const glossaryPage = await fetch(
      `/api/v1/courses/${window.ENV.COURSE_ID}/pages/cdb-glossary`
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
      JSON.parse(body).forEach((term: termDefinition) => {
        this.terms.push({ term: term.term, definition: term.definition });
      });
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
          terms: this.terms,
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
      const definition = this.terms.find(
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
